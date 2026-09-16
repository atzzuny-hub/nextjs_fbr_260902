# 테이블 높이 — 화면 안에 가두고, 스크롤은 표 안에서만

> 환경: Next.js 16 App Router · Tailwind v4 · shadcn/ui Table

## 1. 테이블 영역에 높이 상한 주고 스크롤 처리하기

### 함정 — shadcn `Table`의 컨테이너는 이미 스크롤 컨테이너다

`components/ui/table.tsx`를 보면 `<table>`이 `div[data-slot=table-container]`로 감싸져 있고 그 div가 `overflow-x-auto`다. CSS 규칙상 **한 축이 `auto`면 다른 축도 `auto`로 계산**되기 때문에 이 div는 이미 양방향 스크롤 컨테이너다.

그래서 바깥에 `<div className="overflow-auto">`를 씌우면 두 가지가 꼬인다.

- 헤더의 `sticky top-0`은 **가장 가까운 스크롤 컨테이너**에 붙는다. 그게 안쪽 `table-container`인데, 이 div는 높이 제한이 없어서 세로로 스크롤되지 않는다 → 헤더가 고정되지 않고 같이 올라간다.
- 스크롤은 바깥 div가 하고, 헤더 고정은 안쪽 div 기준이라 서로 다른 요소를 본다.

해법은 **`table-container` 자체를 세로 스크롤러로 만드는 것**이다.

### `Table`에 `containerClassName` prop 추가

`Table` 컴포넌트는 `className`을 `<table>`에만 붙이고 컨테이너 div에는 못 붙인다. shadcn 컴포넌트는 프로젝트에 복사된 코드라 고쳐 쓰는 게 정상이니 prop 하나를 추가한다.

```tsx
// components/ui/table.tsx
function Table({ className, containerClassName, ...props }:
    React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}
```

`{ className, containerClassName, ...props }`처럼 **이름을 적어 꺼낸 것만 `props`에서 빠진다.** 타입에만 추가하고 구조분해에서 안 꺼내면 `...props`에 섞여 `<table>`까지 흘러가고, React가 `React does not recognize the containerClassName prop on a DOM element`라고 경고한다.

### 쓰기

```tsx
// data-table.tsx
<Table containerClassName="min-h-[24rem] max-h-[60vh] overflow-auto">
    <TableHeader className="sticky top-0 z-10 bg-background">
```

- `containerClassName`이다. `className`에 쓰면 `<table>`에 붙어서 스크롤도 헤더 고정도 안 된다.
- `max-h-[60vh]` — 이보다 커지지 마라. 넘는 데이터는 표 안에서 스크롤된다.
- `min-h-[24rem]` — 이보다 작아지지 마라. 0건일 때 헤더만 남고 납작해지는 걸 막고, 결과가 0건이 됐을 때 페이저가 위로 튀어 오르는 것도 막는다.
- `bg-background` — 없으면 헤더 뒤로 행이 비쳐 보인다.

여기서 끝내도 쓸 수 있지만 `60vh`가 매직 넘버다. 상세검색을 펼치면 검색 영역이 커져서 표가 화면 밖으로 밀리고, 접으면 아래가 빈다. 그걸 없애는 게 2절이다.

## 2. 높이를 화면에 꽉 채우기

### 원리 — flex 체인

**뷰포트 높이를 가진 세로 flex 상자를 맨 위에 두고, 테이블까지 내려가는 모든 층이 `flex-1 min-h-0`으로 "남는 높이"를 자식에게 넘겨준다.** 층은 여섯 개다.

```
layout.tsx  루트 div ──────────── h-dvh flex flex-col
  └ layout.tsx  내용 div ───────── flex-1 min-h-0 flex flex-col
      └ page-shell.tsx  루트 div ── flex-1 min-h-0 flex flex-col
          ├ header, search ─────── shrink-0
          └ children div ───────── flex-1 min-h-0 flex flex-col
              └ page.tsx  결과 div ─ flex-1 min-h-0 flex flex-col
                  └ data-table.tsx 루트 div ── flex-1 min-h-0 flex flex-col
                      ├ Table 컨테이너 ──────── flex-1 min-h-0 overflow-auto   ← 스크롤은 여기만
                      └ 페이저 ─────────────── shrink-0
```

하나라도 빠지면 그 아래는 내용 높이만큼 자라서 페이지가 스크롤된다.

### 왜 `min-h-0`인가

flex 세로 상자의 자식은 기본값이 `min-height: auto`다 — **"내 내용보다 작아지지 않겠다"** 는 뜻이다. 그래서 `flex-1`만 주면 남는 높이를 받긴 하는데 내용이 더 길면 그만큼 커져서 부모를 밀고 나간다. `min-h-0`이 "내용보다 작아져도 된다"를 허락해야 `overflow-auto`가 일할 공간이 생긴다. flex 스크롤 영역에서 가장 흔하게 빠뜨리는 클래스다.

### layout.tsx — 뷰포트를 잡는 곳

```tsx
<div className="flex h-dvh flex-col">
    <TopMenu/>
    <div className="mx-auto max-w-screen-2xl w-full px-4 py-6 md:px-6 flex min-h-0 flex-1 flex-col">
        {children}
    </div>
</div>
```

- 루트가 `<>`였던 걸 `<div>`로 바꾼다. 높이를 가질 요소가 필요하다.
- `h-dvh`는 `h-screen`과 달리 모바일 주소창을 뺀 실제 보이는 높이다.
- `TopMenu`는 `h-14`짜리 첫 항목이 된다. `sticky top-0`은 페이지가 더 이상 스크롤되지 않으니 그냥 있어도 무해하다.

### page-shell.tsx — 위는 고정, 아래는 채우기

```tsx
<div className="flex min-h-0 flex-1 flex-col">
    <header className="border-b shrink-0">
        …
    </header>
    {search && (
        <div className="shrink-0">{search}</div>
    )}
    <div className="flex min-h-0 flex-1 flex-col">
        {children}
    </div>
</div>
```

`shrink-0`은 없어도 보통 괜찮지만(내용보다 작아지진 않는다), 상세검색을 펼쳤다 접을 때 헤더·검색 영역이 밀리는 걸 확실히 막는다.

### page.tsx — 결과를 감싼 div

```tsx
return (
    <PageShell …>
        …
        <div className="flex min-h-0 flex-1 flex-col">
            조회 결과 {rowCount}건
            <DataTable … />
        </div>
    </PageShell>
)
```

`<PageShell>`을 감싸던 `<div>`는 **제거했다.** `PageShell` 루트가 이미 div라 층만 하나 늘리는 껍데기였다. 남겨둘 거면 그 div에도 `flex min-h-0 flex-1 flex-col`을 줘야 체인이 이어진다.

### data-table.tsx — 스크롤은 여기서만

```tsx
<div className="flex min-h-0 flex-1 flex-col">
    <Table containerClassName="min-h-0 flex-1 overflow-auto">
        <TableHeader className="sticky top-0 z-10 bg-background">
        …
    </Table>
    <div className="shrink-0 …">
        {/* 페이저·페이지 크기 셀렉트 — 항상 아래 고정 */}
    </div>
</div>
```

- 루트 `<>`를 `<div>`로 바꾼다.
- 1절의 `min-h-[24rem] max-h-[60vh]`는 **둘 다 지운다.** `flex-1`이 남는 높이를 정확히 채우니 상한도 하한도 필요 없다. 0건이어도 영역은 그대로고 빈 상태 행이 그 안에 뜬다.
- `sticky` 헤더는 컨테이너가 여전히 스크롤러라 그대로 동작한다.

### 막혔을 때

표가 화면 아래로 뚫리면 여섯 층 중 `min-h-0 flex-1`이 빠진 div가 있다는 신호다. 개발자 도구에서 `<table>`부터 위로 올라가며 **뷰포트보다 큰 div**를 찾으면 그게 범인이다.

성공 판정은 상세검색이다 — 펼치면 표가 줄고 접으면 다시 늘어나면 된다. `60vh` 매직 넘버로는 안 되던 것이다.

### 다른 페이지는?

`(main)/layout.tsx`를 같이 쓰는 대시보드 등은 영향이 없다. `overflow-auto`가 `DataTable` 안에만 있어서, 내용이 긴 일반 페이지는 예전처럼 페이지 스크롤이 된다.
