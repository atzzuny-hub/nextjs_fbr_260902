# T-2. TanStack Table v9 연결 — 정적 테이블을 columns / DataTable로 쪼개기

> 시리즈: T-1 정적 테이블 관통 → **T-2 TanStack 연결** → T-3 행 펼치기 → T-4 페이지네이션
> 환경: Next.js 16 App Router · React 19 · shadcn/ui · @tanstack/react-table **9.2.4**

## 목표

T-1에서 `page.tsx` 한 파일에 타입·옵션·가공 함수·`<Table>` 마크업을 다 넣고 화면까지 띄웠다.
T-2는 **테이블 화면은 그대로 두고 구조만** TanStack으로 바꾼다. 테이블이 달라지면 실패다.

쪼개는 이유는 다음 단계 때문이다. 행 펼치기(T-3)·페이지네이션(T-4)을 `data.map(...)` 위에 직접 얹으면 페이지마다 같은 코드를 반복하게 된다. TanStack에 넘기면 "무엇을 그릴지"(columns)와 "어떻게 그릴지"(DataTable)가 분리되고, DataTable은 다른 목록 페이지에서도 그대로 재사용된다.

## 0. 설치 — 버전부터 확인 (v8 튜토리얼 함정)

```bash
npm i @tanstack/react-table
```

2026-09 기준 `latest`는 **v9.2.4**다. 검색해서 나오는 블로그 글은 대부분 v8이고, v8 코드를 v9에 그대로 쓰면 타입 에러가 난다.

| v8 (블로그 글 대부분) | v9 (지금 설치되는 것) |
|---|---|
| `useReactTable({...})` | `useTable({ features, columns, data })` |
| `getCoreRowModel()` 옵션 | 없음 — 코어는 자동, 쓸 기능만 `tableFeatures({})`에 등록 |
| `ColumnDef<TData>` | `ColumnDef<TFeatures, TData>` — **첫 인자가 features** |
| `flexRender(def, ctx)` | 그대로 동작한다 — 다만 v9 권장형은 `<table.FlexRender cell={cell} />` |

shadcn 공식 Data Table 문서는 이미 v9 기준이다. 아래 에러가 뜨면 v8 코드를 v9에 쓴 것이다.

```
Type 'OrderItem' has no properties in common with type 'TableFeatures'.
```

## 파일 구조 (작업 순서 = import 순서)

```
app/table-demo/
├─ types.ts                    OrderItem 타입 (T-1 page.tsx에서 분리)
├─ options.ts                  STATUS_OPTIONS — 상태 코드·라벨·배지색 단일 출처
├─ _components/
│  ├─ data-table-features.ts   tableFeatures({}) + DataTableFeatures 타입
│  └─ data-table.tsx           "use client" — useTable + shadcn <Table> 범용 껍데기
├─ columns.tsx                 "use client" — 컬럼 정의 + 셀 가공 함수
└─ page.tsx                    서버 — 데이터 조회 후 <DataTable columns data />
```

파일이 자기를 import하는 파일보다 먼저 나오도록 순서를 잡았다. 실제 프로젝트에선 `_components`는 페이지 공용 폴더(`app/(main)/_components`)에 두고, `formatDateTime` 같은 범용 유틸은 `lib/`로 뺀다. 여기선 예제를 한 폴더에 담기 위해 전부 `table-demo` 안에 넣었다.

## 1. types.ts / options.ts — page.tsx에서 꺼내기

`columns.tsx`가 타입과 상태 목록을 써야 하는데, 둘이 `page.tsx` 안에 있으면 import할 수 없다. 두 파일이 같이 쓸 수 있게 분리한다.

```ts
// app/table-demo/types.ts
// ── 응답 타입 (실제 프로젝트라면 API 응답 모양 그대로) ──
export type OrderItem = {
    idx: number;
    orderNo: string;      // 주문번호
    productName: string;  // 상품명
    status: string;       // 상태 코드 (열린 문자열)
    countryCode: string;  // 국가코드 "FR", "DE" ...
    reqDt: number;        // 접수일 (epoch "초")
    arvDt: number;        // 도착일 (epoch "초", 0이면 미도착)
};
```

```ts
// app/table-demo/options.ts
// ── 상태: 코드·한글·배지색을 한 곳에 (단일 출처) ──
// columns.tsx(배지)와 검색 셀렉트가 같이 쓰는 목록이라 별도 파일로 분리
export const STATUS_OPTIONS = [
    { value: "ORDERED",   label: "주문",     badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { value: "RECEIVED",  label: "접수",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { value: "SHIPPING",  label: "배송중",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { value: "DELIVERED", label: "배송완료", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
];
```

## 2. data-table-features.ts — v9의 "기능 등록"

```ts
// app/table-demo/_components/data-table-features.ts
import { tableFeatures } from "@tanstack/react-table";

// v9는 쓸 기능만 등록하는 방식. 빈 객체 = 코어(행·헤더 모델)만.
// 펼치기·페이지네이션이 필요해지면 여기에 rowExpandingFeature, rowPaginationFeature를 추가
export const features = tableFeatures({});
export type DataTableFeatures = typeof features;
```

v8은 정렬·필터·페이지네이션이 전부 내장이었고, v9는 쓸 기능만 등록한다. 지금은 아무것도 안 쓰니 빈 객체다.

빈 객체인데 파일을 따로 뺀 이유: 이 `features`가 `ColumnDef`의 **첫 번째 타입 인자**다. `columns.tsx`는 타입(`DataTableFeatures`)을, `data-table.tsx`는 값(`features`)을 같은 파일에서 import한다. T-3에서 `rowExpandingFeature`를 추가하면 두 파일이 동시에 그 기능을 알게 된다.

## 3. columns.tsx — "무엇을 어떻게 그릴지"

T-1 `page.tsx`의 `<TableHead>` + `<TableCell>` 한 쌍이 여기서 배열 항목 하나가 된다. 셀 가공 함수 3종(`statusOf`·`flag`·`formatDateTime`)도 `page.tsx`에서 이 파일로 이사한다.

```tsx
// app/table-demo/columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderItem } from "./types";
import { STATUS_OPTIONS } from "./options";
import type { DataTableFeatures } from "./_components/data-table-features";

// ── 셀 가공 함수 3종 (T-1 page.tsx에서 이사) ──
const statusOf = (s: string) =>
    STATUS_OPTIONS.find((o) => o.value === s)
    ?? { label: s, badge: "bg-muted text-muted-foreground" };   // 모르는 코드는 원문 그대로 회색

const flag = (cc: string) =>
    /^[A-Z]{2}$/.test(cc)
        ? cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        : "";   // 모르는 형식이면 국기 생략, 코드만

function formatDateTime(sec: number | null | undefined) {
    if (!sec) return "-";
    const d = new Date(sec * 1000);   // 초 단위 → ×1000
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── 컬럼 정의: T-1의 <TableHead> + <TableCell> 한 쌍이 항목 하나 ──
export const columns: ColumnDef<DataTableFeatures, OrderItem>[] = [
    { accessorKey: "orderNo", header: "주문번호",
        cell: ({ row }) => <span className="font-medium">{row.original.orderNo}</span>,
    },
    { accessorKey: "productName", header: "상품명" },   // 가공 없음 → cell 생략, 값 그대로
    { accessorKey: "status", header: "상태",
        cell: ({ row }) => {
            const s = statusOf(row.original.status);
            return <Badge className={cn("border-transparent", s.badge)}>{s.label}</Badge>;
        },
    },
    { accessorKey: "countryCode", header: "국가",
        cell: ({ row }) => <>{flag(row.original.countryCode)} {row.original.countryCode}</>,
    },
    { accessorKey: "reqDt", header: "접수일",
        cell: ({ row }) => formatDateTime(row.original.reqDt),
    },
    { accessorKey: "arvDt", header: "도착일",
        cell: ({ row }) => formatDateTime(row.original.arvDt),
    },
];
```

항목 하나를 읽는 법:

- `accessorKey` — 행 객체의 **필드명**. 에디터에서 `OrderItem`의 키가 자동완성되지만, **오타를 써도 타입 에러는 나지 않는다** — v9 타입이 `(string & {}) | keyof TData`로 열려 있어서다(`"a.b"` 같은 중첩 경로를 허용하기 위해). 오타가 나면 셀이 조용히 비어서 나온다. 컴파일 때 잡고 싶으면 shadcn 문서처럼 `createColumnHelper<DataTableFeatures, OrderItem>()`의 `columnHelper.accessor("orderNo", {...})`를 쓴다 — 이쪽은 키가 `DeepKeys<TData>`로 제한된다.
- `header` — 컬럼 제목. T-1의 `<TableHead>` 안 글자.
- `cell` — 셀 그리는 함수. T-1의 `<TableCell>` 안 내용. **가공이 없으면 생략**하면 값이 그대로 찍힌다(`productName`).
- `row.original` — 원본 행 객체(`OrderItem`). 다른 필드도 자유롭게 꺼내 쓸 수 있다.

**왜 `"use client"`인가.** `cell`이 함수(JSX)다. 서버 컴포넌트(`page.tsx`)에서 클라이언트 컴포넌트(`DataTable`)로 넘기는 props는 JSON으로 직렬화되는데, 함수는 직렬화가 안 된다. 그래서 `columns.tsx`를 클라이언트 모듈로 만들면 서버는 값 대신 "이 모듈의 `columns`를 써라"는 **참조**만 넘기고, 브라우저에서 실제 배열을 읽는다. shadcn 문서의 `columns.tsx` 첫 줄이 `"use client"`인 이유가 이거다.

## 4. data-table.tsx — "엔진 + 껍데기"

`useTable`로 테이블 인스턴스를 만들고 shadcn `<Table>` 마크업으로 그린다. 컬럼·데이터에 무관한 범용 컴포넌트라 한 번 만들면 다른 목록 페이지에서도 재사용한다. shadcn 공식 Data Table 가이드의 그 파일이다.

```tsx
// app/table-demo/_components/data-table.tsx
"use client"

import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { features, type DataTableFeatures } from "./data-table-features";

interface DataTableProps<TData extends RowData> {
    columns: ColumnDef<DataTableFeatures, TData>[];
    data: TData[];
}

// 컬럼·데이터에 무관한 범용 껍데기 — 어떤 목록 페이지든 columns와 data만 넘기면 된다
export function DataTable<TData extends RowData>({ columns, data }: DataTableProps<TData>) {
    const table = useTable({ features, columns, data });

    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                        {row.getAllCells().map((cell) => (
                            <TableCell key={cell.id}>
                                <table.FlexRender cell={cell} />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

- `useTable({ features, columns, data })` — v8의 `useReactTable` 자리. `getCoreRowModel`은 없다.
- `table.getHeaderGroups()` / `table.getRowModel().rows` — 헤더 줄과 데이터 행. T-1에서 손으로 쓴 `<TableRow>` 두 덩어리가 여기서 나온다.
- `<table.FlexRender header={header} />`, `<table.FlexRender cell={cell} />` — `columns.tsx`의 `header`·`cell`을 실제로 그리는 부분. v8식 `flexRender(cell.column.columnDef.cell, cell.getContext())`도 v9에서 그대로 되지만, v9는 테이블 인스턴스에 붙은 컴포넌트형을 권장한다.
- `row.getAllCells()` — shadcn 문서는 `row.getVisibleCells()`인데, 그건 `columnVisibilityFeature`를 등록해야 생기는 메서드다. `tableFeatures({})`에선 타입 에러가 나므로 `getAllCells()`를 쓴다. **v9에서 "메서드가 없다"는 에러는 대부분 기능 미등록**이다.
- `TData extends RowData` — v9의 행 데이터 제약(객체 또는 배열). `OrderItem`은 객체라 통과.

**왜 `"use client"`인가.** `useTable`은 안에서 `useState` 같은 훅을 쓰는 **훅**이다. 서버 컴포넌트에서 훅을 쓰면 `useState only works in Client Components` 에러가 난다. 실제로 이 줄을 빼먹고 한 번 막혔다.

## 5. page.tsx — 조회는 서버에서, 렌더는 위임

```tsx
// app/table-demo/page.tsx
import type { OrderItem } from "./types";
import { columns } from "./columns";
import { DataTable } from "./_components/data-table";

const DUMMY: OrderItem[] = [ /* T-1과 동일한 7건 */ ];

// 실제 프로젝트에선 여기가 API 호출: const res = await apiFetch(...); return res.json()
async function getData(): Promise<OrderItem[]> {
    return DUMMY;
}

// 서버 컴포넌트: 조회는 서버에서, 렌더는 DataTable(클라이언트)에 위임
export default async function TableDemoPage() {
    const data = await getData();

    return (
        <div className="p-6">
            <h1 className="mb-4 text-xl font-bold">주문 목록 (더미)</h1>
            <p className="mb-2 text-sm text-muted-foreground">조회 결과 {data.length}건</p>
            <DataTable columns={columns} data={data} />
        </div>
    );
}
```

T-1의 `<Table>…data.map…</Table>` 약 30줄이 `<DataTable columns={columns} data={data} />` 한 줄로 바뀌었다. `page.tsx`에는 `"use client"`가 없다 — 데이터 조회는 서버에서 하고, 그리는 일만 클라이언트에 넘긴다.

`조회 결과 N건` 한 줄은 T-2에서 **새로 넣었다**. 0건일 때 빈 표만 보이는 걸 막는 용도라 테이블 자체와는 무관하다 — 테이블은 T-1과 완전히 같아야 한다.

세 파일이 서버/클라이언트 경계를 넘는 방식:

| 파일 | 실행 위치 | 넘기는 것 |
|---|---|---|
| `page.tsx` | 서버 | `data` — 조회한 JSON. 값이라 그대로 넘어간다 |
| `columns.tsx` (`"use client"`) | 클라이언트 | `columns` — 안에 `cell` 함수가 있어 값으로는 못 넘김. 클라이언트 모듈이라 **참조**로 넘어간다 |
| `data-table.tsx` (`"use client"`) | 클라이언트 | 둘을 받아 `useTable`로 조립 |

## 확인

`/table-demo`를 열면 T-1과 같은 화면이 나와야 한다.

- 6컬럼(주문번호·상품명·상태·국가·접수일·도착일), 상태 배지 색, 국기 이모지, 날짜 포맷 동일
- 마지막 행(`XXNEW`, `ZZ`, 날짜 0) 폴백도 동일 — 회색 배지에 코드 원문, 국기 자리엔 미배정 코드라 지역표시 글자(🇿🇿)만, 날짜는 `-`. (`flag()`의 "국기 생략" 분기는 `zz`·`ZZZ`처럼 형식이 어긋날 때만 탄다 — `ZZ`는 형식은 맞는 미배정 코드다)
- T-2에서 새로 넣은 "조회 결과 7건" 표시
- 브라우저 콘솔 에러 없음, `tsc`·`eslint` 통과

테이블이 하나도 안 바뀌었는데 코드만 바뀌었으면 성공이다. 다음 단계부터 이 위에 기능을 얹는다.

## 삽질 기록

1. `ColumnDef<OrderItem>[]` → `TS2707: Generic type 'ColumnDef' requires between 2 and 3 type arguments`
2. v8 기억으로 `ColumnDef<OrderItem, unknown>[]` → `TS2559: Type 'OrderItem' has no properties in common with type 'TableFeatures'`
3. 여기서야 설치 버전을 확인 → v9. 첫 인자는 행 타입이 아니라 **features**. `ColumnDef<DataTableFeatures, OrderItem>[]`로 해결.
4. `data-table.tsx`에 `"use client"` 누락 → 훅 에러. shadcn 문서 첫 줄을 그대로 따라 쳤어야 했다.
5. shadcn 문서의 `row.getVisibleCells()` → 타입 에러. `columnVisibilityFeature` 미등록 상태라 `getAllCells()`로.
6. `accessorKey` 오타는 타입이 안 잡는다는 걸 나중에 알았다. `ColumnDef` 배열 방식은 자동완성만 되고, 오타는 빈 셀로 조용히 나온다. 오타 방어가 필요하면 `createColumnHelper` 방식.

v9 공식 문서는 `node_modules/@tanstack/react-table/skills/*/SKILL.md`, `node_modules/@tanstack/table-core/skills/*/SKILL.md`에 들어 있다. 블로그 글이 안 맞을 때 여기부터 본다(`getting-started`, `migrate-v8-to-v9`).

## 다음 — T-3 행 펼치기

`+` 버튼을 누르면 행 아래에 하위 목록이 펼쳐지는 것. `data-table-features.ts`에 `rowExpandingFeature`와 `expandedRowModel: createExpandedRowModel()`을 추가하고, `columns.tsx`에 토글 컬럼을 하나 더한다. 빈 객체였던 `features`가 처음으로 채워진다.

---

태그: `Next.js` `App Router` `TanStack Table` `React Table v9` `shadcn/ui` `데이터 테이블` `서버 컴포넌트` `use client` `TypeScript`
