# 행 가상화 — 보이는 만큼만 DOM에 만들기

> 환경: Next.js 16 App Router · React 19 · shadcn/ui · @tanstack/react-table 9.2.4 · @tanstack/react-virtual 3.14.13

## 왜

서버 페이지네이션을 붙여서 한 번에 받는 건수는 줄었지만, **한 페이지를 크게 잡으면 그만큼 다 그린다.** 5,461건 중 1,000개씩 보기를 고르면 컬럼이 9개라 셀이 9,000개다. 조회할 때마다 버벅인다.

가상화는 이걸 이렇게 바꾼다.

> 화면에 보이는 만큼(예: 20행)만 실제 DOM에 만들고, 스크롤하면 **그 자리에 들어갈 행으로 내용을 바꿔 끼운다.** 스크롤바가 1,000건짜리로 보이는 건 위아래에 빈 높이를 깔아 전체 높이를 흉내 내기 때문이다.

"스크롤할 때 다시 렌더링한다"가 아니라 **DOM 노드 개수를 20행치로 고정해두고 재활용한다**가 정확하다. 그래서 빨라진다.

### 시작 전에 알 것

가상화는 **`<table>`의 자동 레이아웃을 포기하는 작업**이다. `<tbody>`에 `display: grid`를 주고 각 행을 `position: absolute`로 띄우기 때문에, 브라우저가 컬럼 폭을 알아서 맞춰주던 게 사라진다. 그래서 컬럼 폭을 전부 직접 지정해야 하고, 펼침 행 구조도 바뀐다. 지금까지 붙인 기능 중 가장 침습적이라 **커밋해두고 시작한다.**

그리고 TanStack Table의 기능이 아니다. 공식 문서가 첫 줄에 못 박는다 — *"Virtual is renderer composition, not a Table feature."* 별도 패키지고 `tableFeatures({})`에 등록하지 않는다. **①등록 ②옵션 ③꺼내쓰기 3층 패턴이 여기선 안 통한다.**

## 0. 설치

```bash
npm i @tanstack/react-virtual
```

## 1. 컬럼 폭 — `columnSizingFeature` + `size`

grid 레이아웃은 폭을 직접 줘야 한다. 폭을 `column.getSize()`로 읽으려면 기능을 등록해야 하고, `ColumnDef`에 `size`를 쓸 수 있게 되는 것도 이 기능 덕이다. 선행조건이 없어서 단독 등록이 된다.

```ts
// app/(main)/_components/data-table-features.ts
export const features = tableFeatures({
    // ...기존 등록
    columnSizingFeature,   // ← 추가
});
```

```ts
// app/(main)/data/columns.tsx — 9개 컬럼 전부에
{ id: "expander", header: "", size: 48, cell: … },
{ accessorKey: "orderNo", header: "주문번호", size: 160 },
{ accessorKey: "status", header: "배송상태", size: 100, cell: … },
// ...
```

**하나라도 빠뜨리면 그 컬럼만 기본값을 쓴다.** 이 단계에선 `<table>`이 여전히 자동 레이아웃이라 화면이 안 바뀌어서 눈치채기 어렵다. 3단계에서 폭이 실제로 쓰이는 순간 그 컬럼만 튄다.

확인은 화면이 아니라 값으로 한다 — `console.log(table.getAllColumns().map(c => c.getSize()))`가 `[48, 160, 160, 100, …]`을 돌려주면 된다.

## 2. 스크롤 컨테이너 ref

가상화는 "어느 요소가 스크롤되는지"를 알아야 계산한다. 그게 shadcn `Table`의 컨테이너 div인데 바깥에서 잡을 방법이 없어서 prop을 하나 더 추가한다.

```tsx
// components/ui/table.tsx
function Table({ className, containerClassName, containerRef, ...props }:
    React.ComponentProps<"table"> & {
        containerClassName?: string,
        containerRef?: React.Ref<HTMLDivElement>,      // ← 타입에 선언
    }) {
  return (
    <div
      ref={containerRef}                                // ← 실제로 사용
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
```

```tsx
// app/(main)/_components/data-table.tsx
const scrollRef = useRef<HTMLDivElement>(null);

<Table containerRef={scrollRef} containerClassName="min-h-0 flex-1 overflow-auto">
```

**새 prop 하나당 세 군데를 건드린다.** 하나만 빠져도 증상이 다르다.

| 어디 | 빠뜨리면 |
|---|---|
| 타입에 선언 | `Property 'containerRef' does not exist on type …` |
| 구조분해로 꺼내기 | `...props`에 섞여 `<table>`로 흘러가 `React does not recognize the containerRef prop` |
| 실제로 사용 | 조용히 아무 일도 안 일어남 (가상화가 스크롤 요소를 못 찾는다) |

## 3. 가상화 인스턴스

```tsx
// app/(main)/_components/data-table.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

const rows = table.getRowModel().rows;

const virtualizer = useVirtualizer({
    count: rows.length,                        // data.length 아님
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,                    // 행 하나 예상 높이
    getItemKey: (i) => rows[i].id,
    overscan: 8,
});
```

`count`가 **`rows.length`**여야 한다. `data.length`를 쓰면 전역 필터로 걸러진 결과를 무시하고 원본 개수로 계산해서, 필터를 걸었을 때 빈 공간이 남는다. 공식 문서가 `[HIGH]`로 경고하는 실수다.

`estimateSize`는 정확할 필요 없다 — 실제 높이는 측정해서 보정한다. 다만 실제와 너무 다르면 스크롤바가 출렁인다.

## 4. 렌더 — 헤더와 본문

```tsx
<TableHeader className="sticky top-0 z-10 bg-background">
    {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} style={{ display: "flex", width: table.getTotalSize() }}>
            {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ display: "flex", width: header.column.getSize() }}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
            ))}
        </TableRow>
    ))}
</TableHeader>

<TableBody style={{ display: "grid", height: virtualizer.getTotalSize(), position: "relative" }}>
    {rows.length ? (
        virtualizer.getVirtualItems().map((vi) => {
            const row = rows[vi.index];
            return (
                <TableRow
                    key={row.id}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{
                        position: "absolute",
                        transform: `translateY(${vi.start}px)`,
                        display: "flex",
                        flexWrap: "wrap",
                        width: table.getTotalSize(),
                    }}
                >
                    {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id} style={{ display: "flex", width: cell.column.getSize() }}>
                            <table.FlexRender cell={cell} />
                        </TableCell>
                    ))}
                    {row.getIsExpanded() && renderSubRow && (
                        <TableCell style={{ width: "100%" }}>{renderSubRow(row)}</TableCell>
                    )}
                </TableRow>
            );
        })
    ) : (
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                조회 결과가 없습니다
            </TableCell>
        </TableRow>
    )}
</TableBody>
```

읽는 법 다섯 가지.

- **`virtualizer.getVirtualItems()`를 돈다.** `rows`를 도는 게 아니다. 이게 "지금 보이는 20행"이고, `vi.index`로 `rows`에서 실제 행을 꺼낸다. 여기가 DOM 개수를 고정하는 핵심이다.
- **`data-index`와 `ref={virtualizer.measureElement}`는 한 쌍이다.** 가상화가 "이 요소가 몇 번째 행이고 높이가 얼마인지"를 이걸로 읽는다. 하나만 있으면 측정이 엉뚱한 행으로 간다.
- **`<TableBody>`가 스페이서다.** `height: virtualizer.getTotalSize()`가 전체 높이를 흉내 내서 스크롤바 길이를 만든다. `position: relative`가 있어야 행의 `absolute`가 이 안에서 계산된다.
- **행 폭이 `table.getTotalSize()`로 고정된다.** 컬럼 폭 합계다. 셀들이 첫 줄을 남김없이 채우고 넘치지도 않아서, `flex-wrap`을 켜도 셀끼리는 절대 줄바꿈이 안 된다.
- **펼침은 폭 100%짜리 `<TableCell>`이다.** 첫 줄에 들어갈 자리가 없어서 둘째 줄로 밀린다. `measureElement`가 그 높이까지 재주니 아래 행들이 자동으로 내려간다.

### `<div>`를 쓰면 안 된다 (React 19)

펼침 내용을 `<tr>` 안의 `<div>`로 감싸면 이 에러가 난다.

```
In HTML, <td> cannot be a child of <div>. This will cause a hydration error.
```

React 19는 HTML 중첩 규칙을 검사한다. `<td>`는 `<tr>`의 직계 자식이어야 하니, 세로로 쌓는 건 **`flexWrap: "wrap"` + 폭 100% 셀**로 푼다. 그래서 위 코드에 `flexDirection: "column"`이 아니라 `flexWrap: "wrap"`이 들어가 있다.

## 확인

1. 개발자 도구 Elements에서 `<tbody>` 자식이 **20개 안팎으로 유지**되는지 (1,000개가 아니라)
2. 스크롤하면 행 내용이 바뀌고, 스크롤바 길이가 전체 건수에 맞는지
3. 헤더와 본문 컬럼 줄이 맞는지 — 어긋나면 `size`를 빠뜨린 컬럼부터 의심
4. `[+]` 눌러 펼치면 둘째 줄에 나오고 아래 행들이 밀리는지
5. 행 모델이 바뀌면(필터 등) 스크롤 높이가 같이 바뀌는지 — `count`가 `data.length`가 아니라 `rows.length`인지 확인하는 방법
6. 1,000개씩 보기로 첫 렌더 체감

## 남는 것

**서버에서 1,000건을 받아 파싱하는 비용은 그대로다.** 가상화는 DOM만 줄인다. 조회 자체가 느리면 페이지 크기를 줄이는 게 답이다.

**Ctrl+F는 DOM에 있는 행만 본다.** 보이는 20행 + `overscan` 8행씩이 검색 범위다. 스크롤해서 내려가면 새로 들어온 행이 대상이 된다. "눈에 보이는 것 안에서 하이라이트"가 필요한 범위였어서 이걸로 충분하다고 보고, 데이터를 보는 전역 필터("화면에서 찾기")는 빼기로 했다 — 원본 값 기준이라 상태(`SHIPPING`)·날짜(epoch)를 화면 글자(`배송중`, `2026-09-16`)로는 못 찾는 반쪽이기도 했다. 나중에 "페이지 전체(1,000건)에서 찾기"가 필요해지면 가상화 on/off 토글(끄면 Ctrl+F가 전부 봄)이나, 전역 필터를 되살리고 `columns.tsx`에 `accessorFn`으로 표시용 문자열을 뽑는 방법 중 하나다.

**`useVirtualizer` 줄에 노란줄이 뜬다.** `react-hooks/incompatible-library` — React Compiler가 이 컴포넌트의 자동 메모이제이션을 건너뛴다는 안내다. `useVirtualizer()`가 돌려주는 `getVirtualItems()` 같은 함수는 스크롤마다 다른 답을 내야 해서 캐시하면 화면이 멈추고, TanStack이 그걸 표시해둔 걸 컴파일러가 읽은 것이다. 에러가 아니고 고칠 것도 없다.

**펼친 행이 셀 10개짜리 행이 된다.** 화면상 문제는 없지만, 나중에 셀 단위 기능(셀 선택 등)을 붙일 때 고려할 지점이다.

## 붙이고 나서 잡은 것

기능을 붙이고 실제로 눌러보다 나온 버그들. 증상으로 찾을 수 있게 증상부터 적는다.

### ① 페이지 크기를 바꾸면 빈 화면

**증상** — 100개씩 3페이지를 보다가 셀렉트에서 10을 고르면 URL이 `?page=21&pageSize=10`이 되고 아무것도 안 나온다.

**원인** — `table.setPageSize()`가 "보던 첫 행"을 기준으로 페이지를 다시 계산한다.

```js
const topRowIndex = old.pageSize * old.pageIndex;      // 100 × 2 = 200
const pageIndex = Math.floor(topRowIndex / pageSize);  // 200 / 10 = 20 → 21페이지
```

클라이언트 방식에선 "보던 위치를 유지한다"는 똑똑한 동작인데, 서버 방식에선 139건짜리 목록에 21페이지를 요청하는 꼴이다.

**수정** — `setPageSize`를 거치지 않는 함수를 따로 만들어 URL의 `pageSize`만 바꾸고 `page`를 지운다. 이전/다음 버튼(`onPaginationChange`)은 `page`만 바꾼다. 크기 변경과 페이지 이동이 다른 경로가 된다.

```tsx
const changePageSize = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(next));
    params.delete("page");                 // 1페이지로
    router.push(`?${params.toString()}`);
};

<select value={pageSize} onChange={(e) => changePageSize(Number(e.target.value))}>
```

**확인** — 3페이지에서 크기를 바꾸면 URL이 `?pageSize=10`이 되고 `page`가 사라져 1페이지부터 나온다.

### ② 개수 API에 페이징 파라미터가 같이 나간다

**증상** — 서버 로그에 `/data/cnt?…&pageNo=0&pageSize=10`. `/cnt` 스펙에는 `pageNo`·`pageSize`가 없다. 서버가 무시해줘서 숫자는 맞게 왔지만, 거기 의존하고 있었다.

**원인** — `pageNo`·`pageSize`를 `new URLSearchParams({...})` 안에 처음부터 넣어놓고, 목록과 개수 요청이 같은 `params`를 썼다.

**수정** — 조건을 다 만든 직후 문자열을 떠두고, 그 뒤에 목록용 페이징을 붙인다.

```tsx
const params = new URLSearchParams({ /* 조건만 */ });
if (sp.search) params.set("search", sp.search);
if (sp.status && sp.status !== "ALL") params.set("status", sp.status);

const cntQuery = params.toString();          // 조건만 — /cnt용
params.set("pageNo", String(pageIndex));     // 목록에만
params.set("pageSize", String(pageSize));

const [listRes, cntRes] = await Promise.all([
    apiFetch(`/data?${params.toString()}`),
    apiFetch(`/data/cnt?${cntQuery}`),
]);
```

`toString()`은 **그 시점의 복사본 문자열**을 돌려준다. 그래서 뒤에 `params.set(...)`을 해도 `cntQuery`는 안 바뀐다. 변수 하나로 "조건만" 요청과 "조건 + 페이징" 요청을 만드는 방법이다.

**확인** — 서버 로그에서 `/data/cnt?…`에 `pageNo`·`pageSize`가 없다.

### ③ 조기 return이 검색 패널까지 지운다

**증상** — API가 실패하면 `조회 실패` 글자만 있는 빈 화면. 헤더도 검색 패널도 없어서 조건을 고쳐 다시 조회할 방법이 없다.

**원인** — 실패 시 `return <div>조회 실패</div>`로 **함수 전체를 빠져나가서** `<PageShell>` 바깥으로 나갔다. 그 아래에 있던 `if (!listRes.ok) { error = … }`는 도달했을 땐 항상 성공이라 죽은 코드였고, `data = data`는 자기 자신 대입이었다.

**수정** — 조기 `return`을 없애고 `error`에 상태 코드를 담는다. 아래 `{error ? <div>조회 실패 ({error})</div> : <DataTable …/>}` 분기가 다시 살아난다 — 헤더·검색 패널은 그대로 두고 표 자리에만 실패를 표시한다. T-2 때 설계한 원래 흐름이다.

```tsx
if (!listRes.ok || !cntRes.ok) {
    error = listRes.ok ? cntRes.status : listRes.status;   // 실패한 쪽의 코드
} else {
    data = await listRes.json();
    rowCount = await cntRes.json();
}
```

**확인** — `/data/cnt`를 잠깐 `/data/cntXX`로 바꿔보면 검색 패널은 남고 표 자리에 `조회 실패 (404)`가 뜬다. 확인 후 되돌린다.

### ④ 페이지 크기 허용 목록

**증상** — 주소창에 `?pageSize=999999`를 치면 그대로 서버에 `pageSize=999999`가 나간다.

**원인** — `Number(sp.pageSize) || 10`은 "빈 값이면 10"일 뿐, 숫자면 뭐든 통과시킨다. `pageNo`는 `Number.isInteger`로 검사했는데 페이지 크기는 "정수냐"가 아니라 **"우리가 정한 값 중 하나냐"**가 조건이라 검사 방식이 달라야 했다.

**수정** — 셀렉트 목록을 공용 상수 파일로 빼서 그 배열이 허용 목록 역할까지 하게 한다. `page.tsx`는 검증에, `data-table.tsx`는 셀렉트에 같은 배열을 쓴다.

```ts
// app/(main)/_components/data-table-options.ts — "use client" 없는 순수 상수
export const PAGE_SIZE_OPTIONS = [10, 20, 500, 1000];
export const DEFAULT_PAGE_SIZE = 10;
```

```tsx
// page.tsx
const parsedSize = Number(sp.pageSize);
const pageSize = PAGE_SIZE_OPTIONS.includes(parsedSize) ? parsedSize : DEFAULT_PAGE_SIZE;
```

목록을 `data-table.tsx`("use client")에 두고 `page.tsx`가 import하면 **서버 컴포넌트가 클라이언트 모듈을 읽는 방향**이 된다. 상수라 동작은 하지만 T-2에서 세운 경계와 반대라 중립 파일로 뺐다. `data-table-features.ts`와 같은 성격의 파일이다.

**확인** — `?pageSize=999999` → 서버 로그에 `pageSize=10`. `?pageSize=500` → 500건. 셀렉트 목록은 그대로 네 개.
