# T-5. 열 너비 조절 — 끌어서 바꾸고, 저장하고, 초기화

> 환경: Next.js 16 App Router · React 19 · shadcn/ui · @tanstack/react-table 9.2.4 · eslint-plugin-react-hooks 7.1.1

## 왜

가상화를 붙이면서 컬럼마다 `size`를 고정값으로 박았다. 그런데 보고 싶은 폭은 사람마다, 화면마다 다르다. 주문번호는 좁혀도 되고 상품명은 넓게 보고 싶은 사람이 있다.

만들 것은 세 가지다.

1. 헤더 경계를 **끌어서** 폭을 바꾼다.
2. 바꾼 폭이 **저장**되어 다시 접속해도 그대로다.
3. 표 위에 **초기화 버튼**을 두어 원래 `size`로 되돌린다.

### 시작 전에 알 것

**사이징과 리사이징은 별도 기능이다.** v9는 폭을 "읽고 합산하는" `columnSizingFeature`와 "끌어서 바꾸는" `columnResizingFeature`를 갈라 놓았다. 앞 단계에서 등록한 건 사이징뿐이고, 드래그는 리사이징을 추가로 등록해야 한다. 리사이징이 사이징의 상태를 고치기 때문에 **등록 순서도 사이징이 앞**이다.

**저장할 상태는 `columnSizing` 하나다.** 모양은 `{ 컬럼id: 픽셀 }`이고, 컬럼 id는 `accessorKey`가 그대로 쓰인다. 끌었던 컬럼만 들어가고 나머지는 `columnDef.size`로 떨어진다. 드래그 중의 임시값(`columnResizing`)은 라이브러리가 알아서 관리하니 건드릴 게 없다.

**드래그 계산은 모델 폭 기준이다.** 소스를 보면 새 폭은 `시작 시점의 getSize() + 커서가 움직인 px`다. 화면에 그려진 폭이 아니다. 앞 단계에서 가상 모드 셀에 `flex-grow`를 줘서 화면 폭이 모델보다 넓게 늘어나 있는데, 그대로 두면 커서는 40px 움직였는데 경계는 60px 움직이는 식으로 어긋난다. **리사이징을 붙이면 고정 폭으로 돌아가야 한다.**

**localStorage는 서버에 없다.** `"use client"`를 붙여도 컴포넌트는 서버에서 한 번 렌더된다. 그 시점에 `localStorage`를 읽으면 `ReferenceError`다. 이게 0단계 훅의 모양을 결정한다.

## 0. 저장 훅 — `lib/use-local-storage.ts`

### `useEffect`가 아닌 이유

흔한 패턴은 마운트 후 `useEffect`에서 읽어 `setState`하는 것이다. 이 프로젝트에서는 **린트 에러**다.

```
error  Calling setState synchronously within an effect can trigger cascading renders
       react-hooks/set-state-in-effect
```

`eslint-config-next`가 끌어오는 react-hooks 7의 규칙이다. effect의 몸통에서 바로 `setState`를 부르는 걸 막고, "외부 저장소는 구독하라"고 안내한다. 그 안내를 따르면 답은 `useSyncExternalStore`다.

### 훅

```ts
// lib/use-local-storage.ts
"use client"
import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "local-storage";

function subscribe(cb: () => void) {
    window.addEventListener("storage", cb);   // 다른 탭에서 바뀔 때
    window.addEventListener(EVENT, cb);       // 이 탭에서 set/clear 할 때
    return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(EVENT, cb);
    };
}

function read(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
}

export function useLocalStorageState<T>(key: string, fallback: T) {
    const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

    const value = useMemo<T>(() => {
        try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
    }, [raw, fallback]);

    const set = useCallback((next: T) => {
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(EVENT));
    }, [key]);

    const clear = useCallback(() => {
        localStorage.removeItem(key);
        window.dispatchEvent(new Event(EVENT));
    }, [key]);

    return [value, set, clear] as const;
}
```

읽는 법 세 가지.

- **`useSyncExternalStore`의 세 번째 인자가 서버용이다.** 서버 렌더와 첫 하이드레이션에서는 `() => null`을 쓰고, 그 뒤 클라이언트에서만 두 번째 인자로 진짜 값을 읽는다. 그래서 서버와 클라이언트의 첫 HTML이 같고 하이드레이션 경고가 없다.
- **`storage` 이벤트는 다른 탭에만 간다.** 같은 탭에서 `setItem`을 해도 자기 자신은 알림을 못 받는다. 그래서 `set`/`clear`가 직접 이벤트를 하나 쏘고, `subscribe`가 그걸 같이 듣는다.
- **`fallback`은 모듈 상단 상수로 넘겨야 한다.** `useMemo`가 `fallback`을 의존성으로 보기 때문에, 렌더마다 `{}`를 새로 만들어 넘기면 매번 새 객체가 나와서 테이블 상태 동기화가 헛돈다.

`read`의 `try/catch`는 프라이빗 모드처럼 저장소가 막힌 환경 대비다. 값이 없거나 깨져 있으면 조용히 `fallback`으로 간다.

## 1. 등록 — `data-table-features.ts`

```ts
// app/(main)/_components/data-table-features.ts
import { columnResizingFeature, columnSizingFeature, /* ...기존 */ tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    // ...기존 등록
    columnSizingFeature,
    columnResizingFeature,   // ← 추가. 사이징 뒤에
})
```

등록 전에는 `header.getResizeHandler()`가 타입에도 런타임에도 없다. T-2에서 세운 규칙 그대로다.

## 2. 옵션 — `data-table.tsx`

어느 표의 폭인지 구분할 `storageKey` prop을 받고, 훅으로 상태를 만들고, `useTable`에 연결한다.

```tsx
// app/(main)/_components/data-table.tsx — import
import { useTable, ColumnDef, RowData, Row, type ColumnSizingState } from "@tanstack/react-table";
import { useLocalStorageState } from "@/lib/use-local-storage";

// 모듈 상단 — 렌더마다 새로 만들지 않는다 (0단계 세 번째 이유)
const NO_SIZING: ColumnSizingState = {};
```

```tsx
// props
interface DataTableProps<TData extends RowData>{
    // ...기존
    storageKey?: string      // 표마다 다른 키. 예: "data"
}

export function DataTable<TData extends RowData>({
    columns, data, pageIndex, pageSize, rowCount, renderSubRow, storageKey,
}: DataTableProps<TData>){
```

```tsx
// 훅 호출
const [columnSizing, saveColumnSizing, clearColumnSizing] =
    useLocalStorageState<ColumnSizingState>(`${storageKey ?? "table"}:columnSizing`, NO_SIZING);
```

```tsx
// useTable 옵션
const table = useTable({
    // ...기존
    columnResizeMode: "onChange",
    state: { pagination: { pageIndex, pageSize }, columnSizing },
    onColumnSizingChange: (updater) => {
        const next = typeof updater === "function" ? updater(columnSizing) : updater;
        saveColumnSizing(next);
    },
});
```

`state`와 `onColumnSizingChange`는 **한 쌍**이다. v9 규칙은 "콜백이 소유권을 가져가면 그 값을 `state`로 되돌려 써야 한다"다. 콜백만 주면 라이브러리는 바뀐 값을 어디에도 못 쓴다. `updater`가 함수일 수 있어서 풀어 주는 건 T-4 `onPaginationChange`와 같은 패턴이다.

`columnResizeMode: "onChange"`는 끄는 동안 매 프레임 폭을 커밋한다. 그래서 `saveColumnSizing`도 매 프레임 불려 localStorage에 쓴다. JSON이 컬럼 몇 개짜리라 비용은 없다. 전체 렌더 모드에서 1,000행이 따라 그려지는 게 버벅이면 `"onEnd"`로 바꾸면 놓을 때 한 번만 커밋한다.

## 3. 꺼내쓰기 — `data-table.tsx`

### 핸들

두 모드가 헤더를 공유하니 한 번만 넣으면 된다. 핸들을 `absolute`로 붙이려면 `TableHead`에 `relative`가 필요하고, 조건부 class를 합치려면 `cn`이 필요하다.

```tsx
import { cn } from "@/lib/utils";
```

```tsx
<TableHead
    key={header.id}
    className="relative"
    style={virtual
        ? { display: "flex", width: header.column.getSize(), flex: "0 0 auto" }
        : { width: header.column.getSize() }}
>
    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
    {header.column.getCanResize() && (
        <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={cn(
                "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none",
                header.column.getIsResizing() ? "bg-primary" : "hover:bg-border"
            )}
        />
    )}
</TableHead>
```

- **`onMouseDown`과 `onTouchStart` 둘 다** 걸어야 한다. 핸들러가 이벤트 종류를 보고 마우스 경로와 터치 경로를 나눈다. `pointerdown` 하나로 합치면 터치가 안 된다.
- **`getCanResize()`**가 false인 컬럼엔 핸들을 그리지 않는다. 4단계에서 expander 컬럼을 이렇게 막는다.
- 핸들러는 `mousemove`/`mouseup`을 `document`에 붙이고 놓을 때 스스로 떼어 낸다. 정리 코드는 필요 없다.

### 폭 적용 — 두 모드

가상 모드는 `flex-grow`를 버린다. "시작 전에 알 것"의 세 번째 이유다. 헤더 셀은 위 코드에 이미 들어 있고, 본문 셀은 이렇게 바꾼다.

```tsx
// 가상 모드 본문 셀
style={{
    display: "flex",
    width: cell.column.getSize(),
    flex: "0 0 auto",      // ← 늘어나지도 줄어들지도 않는다
}}
```

`minWidth`는 지운다. `width`와 같은 값이라 하는 일이 없었다. 대신 컬럼 폭 합계가 컨테이너보다 좁으면 **오른쪽에 빈 띠가 다시 생긴다.** 폭을 끌어서 맞추는 기능이니 감수한다.

전체 렌더 모드는 지금까지 폭을 전혀 안 썼다. 브라우저 자동 레이아웃이 `size`를 무시하기 때문이다. `table-layout: fixed`로 바꾸고 표 전체 폭을 주면 헤더 첫 줄의 `<th>` 폭이 열 폭이 된다.

```tsx
<Table
    className={virtual ? undefined : "table-fixed"}
    style={virtual
        ? { minWidth: table.getTotalSize() }     // 가상: 이보다 좁아지면 가로 스크롤
        : { width: table.getTotalSize() }}       // 전체 렌더: 이 폭으로 고정
    containerRef={scrollRef}
    containerClassName="min-h-0 flex-1 overflow-auto"
>
```

본문 `<td>`에는 폭을 안 줘도 된다. `table-fixed`가 헤더 줄 폭으로 열을 정한다.

### 초기화 버튼

토글 버튼 옆에 하나 더 둔다.

```tsx
<div className="flex shrink-0 items-center justify-end gap-2 pb-2">
    <Button variant="outline" size="sm" onClick={clearColumnSizing}>열 너비 초기화</Button>
    <Button variant="outline" size="sm" onClick={() => setVirtual((v) => !v)}>
        {virtual ? "전체 렌더로 (Ctrl+F)" : "가상 스크롤로"}
    </Button>
</div>
```

**`table.resetColumnSizing()`을 부르지 않는다.** 이 설계에서 상태의 원천은 localStorage다. 키를 지우면 훅이 `fallback`(`{}`)을 돌려주고, `state.columnSizing`이 `{}`가 되어 모든 컬럼이 `columnDef.size`로 돌아간다. `resetColumnSizing(true)`를 써도 결과는 같다. 그건 `onColumnSizingChange`를 거쳐 `{}`를 **저장**하는 경로라 키가 남는다는 차이만 있다.

## 4. 연결 — `page.tsx`, `columns.tsx`

```tsx
// app/(main)/data/page.tsx
<DataTable
    columns={columns} data={data} renderSubRow={renderSubRow}
    pageIndex={pageIndex} pageSize={pageSize} rowCount={rowCount}
    storageKey="data"                          // ← 추가
/>
```

```tsx
// app/(main)/data/columns.tsx
{ id: "expander", header: "", size: 48, enableResizing: false, cell: … },   // 펼침 버튼은 폭 고정
{ accessorKey: "orderNo", header: "주문번호", size: 160, minSize: 60 },      // 하한은 선택
```

기본 하한이 20px라 실수로 컬럼이 거의 사라질 수 있다. `minSize`를 주면 그 아래로는 안 줄어든다.

## 확인

1. 헤더 경계를 끌면 **커서와 경계선이 붙어서** 움직이고, 본문 열도 같이 가는지. 어긋나면 3단계 `flex: "0 0 auto"`가 빠진 것.
2. 새로고침하면 그 폭이 남아 있는지. 개발자 도구 Application → Local Storage에 `data:columnSizing` 키가 있고 값이 `{"orderNo":200}`처럼 **끌었던 컬럼만** 들어 있는지.
3. "열 너비 초기화"를 누르면 원래 폭으로 돌아가고 키가 사라지는지.
4. "전체 렌더로" 바꿔도 같은 폭인지. 1,000건에서 끌 때 버벅이면 `columnResizeMode`를 `"onEnd"`로.
5. expander 열의 오른쪽 경계에는 핸들이 없고 커서가 바뀌지 않는지.

## 남는 것

**첫 프레임은 기본 폭이다.** 서버는 저장값을 모르니 기본 `size`로 그리고, 클라이언트가 붙은 다음 렌더에 저장 폭으로 바뀐다. 한 프레임 깜빡임은 이 구조에서 피할 수 없다.

**컬럼 id를 바꾸면 저장값이 안 맞는다.** 키가 `accessorKey`라서, 이름을 바꾸면 그 컬럼만 기본 폭으로 돌아간다. 깨지지는 않는다.

**헤더 글자가 폭보다 길면 넘친다.** `TableHead`에 `overflow-hidden`을 더하면 잘린다. 본문 셀은 이미 `whitespace-nowrap`이라 같은 처리를 하면 된다.

**저장 훅은 다른 데도 쓸 수 있다.** 가상화 on/off 토글도 `useState` 대신 이 훅에 얹으면 새로고침해도 유지된다.

## 붙이고 나서 잡은 것

### ① `storageKey`를 안 넘겨서 기본 키로 저장됐다

**증상** — Local Storage에 `data:columnSizing`이 아니라 `table:columnSizing`이 생긴다.

**원인** — 2단계에서 prop을 받게 해 놓고 4단계에서 `page.tsx`에 넘기는 걸 빠뜨렸다. `storageKey ?? "table"` 폴백이 동작한 것. 표가 하나일 땐 아무 문제가 없어서 눈에 안 띈다.

**수정** — `<DataTable … storageKey="data" />`.

**확인** — 키 이름이 `data:columnSizing`으로 바뀐다. 표를 하나 더 만들 때 폭이 섞이지 않는다.
