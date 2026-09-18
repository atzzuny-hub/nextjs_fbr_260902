# T-6. 컬럼 정렬 — 헤더를 눌러 오름·내림, 버튼으로 초기화

> 환경: Next.js 16 App Router · React 19 · shadcn/ui · @tanstack/react-table 9.2.4 · lucide-react

## 왜

헤더를 누르면 그 컬럼으로 정렬되고, 다시 누르면 방향이 바뀌고, 표 위의 버튼 하나로 원래 순서로 돌아오는 것. 앞 단계에서 "열 너비 초기화" 버튼을 만들었으니 그 옆에 "정렬 초기화"가 나란히 선다.

### 먼저 정한 것 — 클라이언트 정렬

이 표는 **서버 페이지네이션**이다. 서버가 한 페이지만 보내 준다. 그래서 정렬을 어디서 하느냐가 결과를 바꾼다.

| | 어디서 | 무엇이 정렬되나 | 조건 |
|---|---|---|---|
| A. 클라이언트 | TanStack이 받아온 배열을 정렬 | **지금 페이지 안**에서만 | 없음 |
| B. 서버 | 정렬 조건을 URL에 실어 API로 | 전체 건수 | API가 정렬 파라미터를 받아야 함 |

A를 골랐다. 1페이지를 "주문일 내림차순"으로 놓아도 그건 **전체 5,000건의 최신순이 아니라 이 페이지 500건의 최신순**이다. 전역 필터를 뺄 때와 같은 종류의 반쪽인데, 페이지 크기를 500이나 1,000으로 놓고 보는 용도라 실용적이라고 봤다. 나중에 B로 가면 바뀌는 건 옵션 하나(`manualSorting: true`)와 상태를 `useState` 대신 URL에 두는 것뿐이고, 등록과 헤더 렌더는 그대로다.

### 시작 전에 알 것

**행 모델 순서는 정렬 → 펼침 → 페이지네이션이다.** `manualPagination`이라 마지막 단계는 통과되어 `getRowModel()`이 곧 정렬된 모델이다. 가상화의 `count: rows.length`와 `getItemKey: rows[i].id`는 손댈 게 없다. 정렬은 행의 **순서**만 바꾸고 `row.id`는 원본 인덱스 그대로라, key가 행을 따라간다.

**정렬 함수도 쓰는 것만 등록한다.** v9는 `sortFns` 슬롯에 등록한 함수만 이름으로 부를 수 있다. 컬럼에 `sortFn`을 안 주면 `'auto'`인데, 이건 첫 열 개 행의 값을 보고 고른다 — Date면 `datetime`, 문자와 숫자가 섞인 문자열이면 `alphanumeric`, 그냥 문자열이면 `text`. **숫자는 등록 없이 기본 비교로 떨어진다.** 이 표의 날짜 세 컬럼은 값이 epoch 숫자라 그대로 맞는다.

**`accessorFn`이 없는 컬럼은 정렬할 수 없다.** 정렬 가능 판정은 이렇다.

```js
// table-core rowSortingFeature.utils.js
(columnDef.enableSorting ?? true) && (table.options.enableSorting ?? true) && !!column.accessorFn
```

마지막 조건 때문에 `id`만 있는 표시용 컬럼(펼침 버튼 열)은 **아무 설정 없이 자동으로 정렬 불가**다. `enableSorting: false`를 따로 줄 필요가 없다.

## 1. 등록 — `data-table-features.ts`

```ts
// app/(main)/_components/data-table-features.ts
import {
    /* ...기존 */
    rowSortingFeature, createSortedRowModel,
    sortFn_alphanumeric, sortFn_text, sortFn_datetime,
    tableFeatures,
} from "@tanstack/react-table";

export const features = tableFeatures({
    // ...기존 등록
    rowSortingFeature,                                                                        // ← 추가
    sortedRowModel: createSortedRowModel(),                                                   // ← 추가
    sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime }, // ← 추가
})
```

세 슬롯이 한 세트다. 기능(`rowSortingFeature`)이 상태와 컬럼 메서드를 만들고, 행 모델(`sortedRowModel`)이 실제로 순서를 바꾸고, `sortFns`가 비교 함수를 공급한다. 하나라도 빠지면 증상이 다르다 — 기능이 없으면 `getToggleSortingHandler`가 타입에서 사라지고, 행 모델이 없으면 화살표는 바뀌는데 행이 안 움직이고, `sortFns`가 없으면 문자열 컬럼이 기본 비교로 떨어진다.

## 2. 옵션 — `data-table.tsx`

상태는 `sorting: Array<{ id, desc }>`다. 열 너비처럼 `state`와 `onSortingChange` 한 쌍으로 연결한다.

```tsx
// app/(main)/_components/data-table.tsx — import
import { useTable, ColumnDef, RowData, Row, ColumnSizingState, type SortingState } from "@tanstack/react-table";
```

```tsx
// 컴포넌트 안
const [sorting, setSorting] = useState<SortingState>([]);
```

```tsx
// useTable 옵션
const table = useTable({
    // ...기존
    state: { pagination: { pageIndex, pageSize }, columnSizing, sorting },   // ← sorting 추가
    onSortingChange: setSorting,                                              // ← 추가
    enableMultiSort: false,                                                   // ← 추가
});
```

`onSortingChange`에는 `setSorting`을 그대로 넘겨도 된다. React의 setState가 값과 updater 함수를 둘 다 받으니, 페이지네이션이나 열 너비에서 하던 "함수면 풀어서 해소"를 여기선 안 해도 된다.

`enableMultiSort: false`는 Shift 클릭 다중 정렬을 끈다. 기본은 켜져 있고 판정은 `e.shiftKey`다. 이 표는 컬럼 하나씩이면 충분하다.

**클릭 순환은 기본이 오름 → 내림 → 해제**다. "누르면 오름, 다시 누르면 내림" 두 상태만 돌게 하려면 `enableSortingRemoval: false`를 더한다. 해제는 초기화 버튼이 맡으니 그쪽이 요구와 맞는데, 세 번째 클릭으로도 풀리는 게 편하면 기본값 그대로 둔다.

열 너비는 localStorage에 저장했지만 정렬은 `useState`다. 저장할 요구가 없었고, 페이지를 넘겨도 컴포넌트가 살아 있어 정렬은 유지된다(같은 자리의 클라이언트 컴포넌트는 검색 파라미터가 바뀌어도 리마운트되지 않는다).

## 3. 꺼내쓰기 — `data-table.tsx`

### 헤더 — 토글은 `<th>`가 아니라 헤더 글자에

리사이즈 핸들이 `<th>` 안에 있다. 토글을 `<th>`에 걸면 **폭을 끌고 놓는 순간 `click`이 `<th>`까지 올라와 정렬도 같이 바뀐다.** 그래서 `FlexRender`를 버튼으로 감싸고 토글을 거기에 건다. 핸들은 형제 요소라 버튼의 클릭과 섞이지 않는다.

```tsx
import { ArrowUp, ArrowDown } from "lucide-react";
```

```tsx
<TableHead key={header.id} className="relative" style={/* T-5 그대로 */}>
    {header.isPlaceholder ? null : (
        <button
            type="button"
            onClick={header.column.getToggleSortingHandler()}
            disabled={!header.column.getCanSort()}
            className="flex items-center gap-1"
        >
            <table.FlexRender header={header} />
            {header.column.getIsSorted() === "asc" && <ArrowUp className="size-3.5" />}
            {header.column.getIsSorted() === "desc" && <ArrowDown className="size-3.5" />}
        </button>
    )}
    {header.column.getCanResize() && (
        <div /* 리사이즈 핸들 — T-5 그대로 */ />
    )}
</TableHead>
```

- **`getToggleSortingHandler()`**가 클릭 한 번에 다음 상태로 넘기는 핸들러를 돌려준다. 순환 규칙(오름 → 내림 → 해제)과 Shift 판정이 이 안에 있다.
- **`getCanSort()`**가 false면 버튼을 잠근다. 펼침 버튼 열이 여기서 자동으로 걸린다("시작 전에 알 것" 세 번째).
- **`getIsSorted()`**는 `"asc" | "desc" | false`다. 화살표 하나만 그리면 되고, 해제 상태면 아무것도 안 그린다.

### 초기화 버튼

"열 너비 초기화" 옆에 하나 더.

```tsx
<div className="flex shrink-0 items-center justify-end gap-2 pb-2">
    <Button variant="outline" size="sm" onClick={clearColumnSizing}>열 너비 초기화</Button>
    <Button variant="outline" size="sm" onClick={() => table.resetSorting(true)}>정렬 초기화</Button>   {/* ← 추가 */}
    <Button variant="outline" size="sm" onClick={() => setVirtual((v) => !v)}>
        {virtual ? "전체 렌더로 (Ctrl+F)" : "가상 스크롤로"}
    </Button>
</div>
```

`resetSorting(true)`는 `onSortingChange([])`를 거친다. 그래서 `useState`로 들고 있어도, 나중에 URL로 옮겨도 버튼 코드는 그대로다. 인자 `true`는 "`initialState.sorting`이 아니라 빈 배열로"라는 뜻인데 지금은 둘이 같다.

## 확인

1. 헤더를 한 번 누르면 위 화살표와 오름차순, 다시 누르면 아래 화살표와 내림차순, 세 번째에 화살표가 사라지고 원래 순서로.
2. **핸들을 끌어 폭을 바꾸고 놓았을 때 정렬이 바뀌지 않는지.** 바뀌면 토글이 `<th>`에 걸린 것.
3. "정렬 초기화"로 화살표가 사라지고 서버가 준 순서로 돌아오는지.
4. 정렬한 채 다음 페이지로 넘기면 새 페이지도 같은 컬럼으로 정렬돼 있는지. 화살표가 남아 있어야 한다.
5. 펼침 버튼 열의 헤더는 눌러도 반응이 없는지.
6. 날짜 컬럼이 시간순으로 서는지(값이 epoch 숫자라 기본 비교). 문자열 컬럼(주문번호)은 `alphanumeric`으로 `ORD-2`가 `ORD-10` 앞에 오는지.

## 남는 것

**현재 페이지만 정렬한다.** 이 글의 첫 결정이다. 전체를 정렬해야 하면 `manualSorting: true`를 켜고 `sorting`을 `page`처럼 URL에 실어 서버로 보낸다. API가 받아야 한다.

**배송상태는 라벨이 아니라 코드 순서다.** 원본 값(`ORDERED`, `SHIPPING`)의 알파벳순이라 화면 글자(`주문접수`, `배송중`) 순서와 다르다. 라벨 순서가 필요하면 그 컬럼에 `sortFn`을 직접 주거나 `accessorFn`으로 라벨을 뽑는다. 전역 필터 때와 같은 이유, 같은 처방이다.

**세 번째 클릭이 해제다.** `enableSortingRemoval: false`로 두 상태 순환으로 바꿀 수 있다.

**정렬은 저장하지 않는다.** 새로고침하면 풀린다. 열 너비처럼 남기고 싶으면 `useLocalStorageState`에 얹으면 되는데, 매번 같은 정렬로 열리는 게 오히려 낯설 수 있어 일단 뺐다.

## 붙이고 나서 잡은 것

### ① 계획에 있던 "4단계 연결"이 필요 없었다

**계획** — `columns.tsx`에서 펼침 버튼 열에 `enableSorting: false`를 주고, 날짜·상태 컬럼의 정렬 방식을 손본다.

**실제** — 등록과 옵션, 헤더 렌더만으로 동작했다. 펼침 버튼 열은 `accessorFn`이 없어 이미 정렬 불가였고, 날짜는 epoch 숫자라 기본 비교로 맞았다. 상태 컬럼은 코드 순서로 정렬되지만 지금 요구엔 문제가 아니다.

**배운 것** — 소스 한 줄(`!!column.accessorFn`)이 설정 하나를 지웠다. "이 컬럼은 정렬 안 되게"를 코드로 쓰기 전에 **정렬 가능 판정이 무엇을 보는지** 먼저 확인하는 게 순서다.
