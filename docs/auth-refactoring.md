# 로그인 인증 리팩토링 노트

> localStorage 토큰 저장 → httpOnly 쿠키 방식으로 전환한 기록 (2026-09)

## 왜 바꿨나

기존 방식은 로그인 응답(토큰 포함)을 **localStorage에 통째로 저장**했다. 문제 두 가지:

1. **XSS에 그대로 노출** — localStorage는 페이지의 모든 JavaScript가 읽을 수 있다. 악성 스크립트가 하나라도 실행되면 토큰을 훔쳐갈 수 있다.
2. **서버가 로그인 여부를 알 수 없다** — localStorage는 브라우저에만 있으므로 라우트 보호를 클라이언트에서만 할 수 있다. 비로그인 사용자가 `/dashboard`를 URL로 직접 치고 들어오는 걸 서버에서 못 막는다.

httpOnly 쿠키는 **JavaScript가 읽을 수도 쓸 수도 없고**(XSS 차단), 요청마다 자동으로 서버에 전달되므로 서버 레벨 가드(proxy)가 가능하다.

## 구조 비교

```
Before:  브라우저 ──fetch──▶ 외부 API          (토큰이 브라우저 JS에 노출)

After:   브라우저 ──form──▶ Next 서버(Server Function) ──fetch──▶ 외부 API
                    ◀── httpOnly 쿠키 Set-Cookie ──┘   (토큰이 브라우저 JS에 안 보임)
```

핵심: **토큰과 API 주소는 서버만 알고, 브라우저는 만질 수 없는 도장(쿠키)만 갖고 다닌다.**

## 파일 구성 (놀이공원 비유)

| 파일 | 역할 | 비유 |
|---|---|---|
| `app/login/_components/login-form.tsx` | 이메일/비밀번호를 Server Function에 제출 | 창구에 쪽지 내미는 손님 |
| `app/login/actions.ts` | `"use server"` — 서버에서 외부 API 호출, 성공 시 세션 생성 후 redirect | 뒷방에서 본사에 전화하는 직원 |
| `lib/session.ts` | httpOnly 쿠키 생성(`createSession`)/삭제(`deleteSession`) 헬퍼 | 손목 도장 찍기/지우기 도구함 |
| `proxy.ts` (프로젝트 루트) | **모든 요청**이 페이지에 닿기 전에 쿠키 검사 → 통과/리다이렉트 결정 | 모든 문 앞의 경비원 |

- 경비원(proxy)은 로그인 과정의 마지막 단계가 아니라 **매 페이지 이동마다 항상 먼저** 실행된다.
- 도장을 찍기로 결정하는 주체는 직원(actions.ts)이고, session.ts는 도구함일 뿐이다.

## Before — 한 파일에 전부 (`login-form.tsx`)

```tsx
"use client"
// useState로 email/password/loading/error 전부 직접 관리
// useEffect로 localStorage 확인해서 로그인 상태면 /dashboard로 (클라이언트 가드)

const handleClickSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // ...검증...
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) { setErrMessage("이메일, 비밀번호를 확인해주세요."); return }
    const result = await res.json()
    localStorage.setItem("user", JSON.stringify(result))  // ← 토큰이 JS에 노출
    router.replace("/dashboard")
}
```

- API 주소가 `NEXT_PUBLIC_`이라 클라이언트 번들에 노출
- 토큰이 localStorage에 노출
- 로딩/에러 state 수동 관리, 라우트 가드는 useEffect(깜빡임 있음)

<details>
<summary><strong>당시 전체 코드 보기</strong> (localStorage 방식 원본)</summary>

```tsx
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginForm(){

    const router = useRouter()
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loding, setLoding] = useState<boolean>(false)
    const [errMessage, setErrMessage] = useState<string>('')

    // 클라이언트 가드: 이미 로그인 상태면 dashboard로 (깜빡임 있음, 서버는 모름)
    useEffect(()=>{
        const localUser = localStorage.getItem('user')
        if(localUser){
            router.replace('/dashboard')
        }
    },[router])

    const handleClickSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setErrMessage('')

        if(!email || !password){
            setErrMessage('이메일, 비밀번호를 입력해주세요.')
            return
        }

        setLoding(true)

        try{
            // API 주소가 NEXT_PUBLIC_ → 클라이언트 번들에 노출
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({email, password})
            })

            if(!res.ok){
                setErrMessage('이메일, 비밀번호를 확인해주세요.')
                return;
            }

            const result = await res.json()

            // 응답(토큰 포함)을 localStorage에 통째로 저장 → XSS에 노출
            localStorage.setItem('user', JSON.stringify(result))
            router.replace('/dashboard')

        }catch(err){
            setErrMessage('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            console.log(err);
        }finally{
            setLoding(false)
        }
    }
    return(
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                Enter your email below to login to your account
                </CardDescription>
                <CardAction>
                <Button variant="link">Sign Up</Button>
                </CardAction>
            </CardHeader>
            <form onSubmit={handleClickSubmit}>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e)=> setEmail(e.target.value)}
                            required
                        />
                        </div>
                        <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                            Forgot your password?
                            </a>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e)=> setPassword(e.target.value)}
                        />
                        </div>
                    </div>
                    {errMessage && <p className="mt-5 text-destructive">{errMessage}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-2 mt-5">
                    <Button type="submit" className="w-full" disabled={loding}>
                        {loding ? '로그인중...' : '로그인'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
```

</details>

## After — 역할별 4개 파일

### 1. `login-form.tsx` — 제출만 담당 (대폭 단순해짐)

```tsx
"use client"
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
    const [state, action, pending] = useActionState(login, undefined);
    return (
        <form action={action}>
            {/* Input은 value/onChange 없이 name="email", name="password"만 */}
            {state?.error && <p className="text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending}>
                {pending ? "로그인중..." : "로그인"}
            </Button>
        </form>
    );
}
```

fetch, preventDefault, localStorage, 수동 로딩 state, useEffect 가드 전부 삭제.
`useActionState`가 pending(로딩)과 state(에러)를 대신 관리한다.

### 2. `app/login/actions.ts` — Server Function

```ts
"use server";   // ← 이 한 줄이 없으면 클라이언트 번들로 끌려가서 next/headers 에러

import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");
    if (!email || !password) return { error: "이메일, 비밀번호를 입력해주세요." };

    const res = await fetch(`${process.env.API_URL}/auth/login`, {  // NEXT_PUBLIC_ 불필요
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();   // body는 한 번만 읽을 수 있다!

    if (!res.ok) return { error: "이메일, 비밀번호를 확인해주세요" };

    const { accessToken } = data;    // 실제 응답 필드명 확인 필수 (token 아님)
    await createSession(accessToken);
    redirect("/dashboard");          // throw 방식 — 이 뒤 코드는 실행 안 됨
}
```

### 3. `lib/session.ts` — 세션 헬퍼

```ts
import "server-only";   // 클라이언트에서 import하면 빌드 에러 (안전장치)
import { cookies } from "next/headers";

export async function createSession(token: string) {
    const cookieStore = await cookies();   // Next 16: cookies()는 async
    cookieStore.set("session", token, {
        httpOnly: true,                                    // JS에서 접근 불가
        secure: process.env.NODE_ENV === "production",     // 개발(http)에선 꺼야 함
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,  // 7일
    });
}

export async function deleteSession() {
    (await cookies()).delete("session");   // 로그아웃용
}
```

쿠키 set/delete는 **Server Function이나 Route Handler 안에서만** 가능하다.

### 4. `proxy.ts` — 라우트 가드 (프로젝트 루트)

```ts
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");

    if (!session && !isLoginPage)
        return NextResponse.redirect(new URL("/login", request.url));
    if (session && isLoginPage)
        return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
}

export const config = {
    // 제외 패턴 필수 — 없으면 CSS/이미지 요청까지 로그인으로 리다이렉트됨
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
```

> Next 16에서 `middleware.ts`는 deprecated → `proxy.ts`로 이름이 바뀌었다.

## 로그아웃 — 같은 구조의 반대 방향

httpOnly 쿠키는 **브라우저 JS가 지울 수도 없다.** 그래서 로그아웃도 로그인과 똑같이 Server Function이 처리한다. 도구함(session.ts)의 `deleteSession`은 이미 만들어뒀으므로 두 조각만 추가하면 된다.

### 1. 로그아웃 액션 (`app/login/actions.ts`에 추가)

```ts
export async function logout() {
    await deleteSession();     // 도구함에서 지우개 꺼내 쓰기 — 반드시 먼저!
    redirect("/login");        // redirect는 throw 방식이라 이 뒤 코드는 실행 안 됨
}
```

- 파일 맨 위에 이미 `"use server"`가 있으므로 export만 하면 Server Function이 된다.
- 로그인 액션과 달리 인자(`prevState`, `formData`)가 필요 없다 — 받을 폼 데이터가 없으니까.
- **순서 주의**: `redirect()`를 먼저 쓰면 `deleteSession()`이 영영 실행되지 않는다.

### 2. 드롭다운 "Log out" 항목에 연결 (`mypage-menu.tsx`)

**방법 A — onClick 호출 (드롭다운 메뉴엔 이걸 권장)**

```tsx
"use client"   // onClick 핸들러를 쓰므로 파일 맨 위에 추가 필요

import { logout } from "@/app/login/actions";

<DropdownMenuItem onClick={() => logout()}>
    Log out
</DropdownMenuItem>
```

클라이언트 컴포넌트의 이벤트 핸들러에서 Server Function을 **그냥 함수처럼 호출**할 수 있다.
내부적으로 서버에 POST가 날아가고, 액션의 redirect 응답을 받으면 브라우저가 알아서 이동한다.

**방법 B — form action (독립된 로그아웃 버튼일 때)**

```tsx
<form action={logout}>
    <button type="submit">Log out</button>
</form>
```

`"use client"` 없이도 되고 JS 로드 전에도 동작하지만, 드롭다운 **메뉴 항목 안에** form을 넣으면
클릭 영역/메뉴 닫힘 동작이 어긋나기 쉬워서 DropdownMenuItem 안에서는 방법 A가 깔끔하다.

### 동작 확인 포인트

1. Log out 클릭 → 서버가 `session` 쿠키 삭제 + `/login` 이동
2. 이후 `/dashboard`를 URL로 직접 쳐도 경비원(proxy)이 `/login`으로 되돌려보냄
3. DevTools → Application → Cookies에서 `session`이 사라졌는지 확인

## 2차 작업 — 사용자 정보 표시 · API 관문 · 토큰 갱신

### 사용자 정보 표시: 서버 → 클라이언트 릴레이

httpOnly 쿠키는 클라이언트 컴포넌트가 못 읽는다. 그래서 **서버 컴포넌트가 읽어서 props로 건네주는 릴레이 구조**가 된다.

- **세션 확장** — 프로필 API가 없으므로 로그인 응답의 값을 세션 쿠키에 같이 저장:
  `Session = { accessToken, refreshToken, name, email, auth }` (JSON.stringify로 저장, `getSession()`이 JSON.parse)
  - `tmzn`/`utc`/`webClientIds`는 제외 — 쿠키는 **4KB 제한**이 있고 매 요청 왕복하는 짐이다
- **릴레이**: `top-menu.tsx`(서버, async) → `getSession()` → `<MypageMenu user={session && {name, email}} />` → `mypage-menu.tsx`(클라)가 props로 받아 표시
- ⚠️ **세션 객체를 통째로 props로 넘기면 안 된다** — props는 직렬화돼 브라우저로 전송되므로 accessToken이 다시 노출된다. name/email만 골라서 넘길 것
- ⚠️ 쿠키 **구조**를 바꾸면 기존 브라우저의 옛 쿠키는 파싱 실패 → getSession이 null → 재로그인 필요

### API 관문: `lib/api.ts`의 `apiFetch`

모든 서버 측 API 호출이 지나가는 관문 함수. 갱신 로직도 여기 한 곳에만 둔다.

```ts
import "server-only";   // 클라이언트에서 import하면 빌드 에러 (안전장치)

export async function apiFetch(path: string, init: RequestInit = {}) {
    const session = await getSession();
    if (!session) return null;

    const call = (token: string) =>
        fetch(`${process.env.API_URL}${path}`, {
            ...init,
            headers: { ...init.headers, Authorization: `Bearer ${token}` },
        });

    let res = await call(session.accessToken);      // 1차 시도

    if (res.status === 401) {                        // 만료 → 갱신 → 1회 재시도
        const refreshRes = await fetch(`${process.env.API_URL}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (!refreshRes.ok) return res;              // 갱신 실패 = 세션 만료

        const refreshed = await refreshRes.json();
        try {
            await createSession({ ...session, accessToken: refreshed.accessToken });
        } catch {}   // ⚠️ 서버 컴포넌트 렌더링 중엔 쿠키 쓰기 불가 (아래 제약)

        res = await call(refreshed.accessToken);
    }
    return res;
}
```

**알아야 할 제약** — 쿠키 쓰기는 Server Function/Route Handler에서만 허용된다. 페이지 렌더링 중 갱신되면 새 토큰으로 이번 요청은 성공하지만 쿠키에 저장은 못 해서, 다음 페이지에서 또 401 → 또 갱신이 반복된다(동작은 함). 이 비효율까지 없애려면 **proxy에서 만료 임박 토큰을 선갱신**하는 패턴으로 넘어간다 — proxy는 매 요청 실행되면서 응답에 쿠키를 쓸 수 있는 유일한 지점.

### 데이터 조회 페이지 패턴 (`dtin` 예시)

```tsx
import { apiFetch } from "@/lib/api";
import type { InboundItem } from "./types";   // 응답 타입은 라우트 옆 types.ts에

export default async function DtinPage(){     // async 서버 컴포넌트 = "접속하면 바로 조회"
    const params = new URLSearchParams({ wmsLinkId: "-100", /* ... */ });
    const res = await apiFetch(`/dtin?${params.toString()}`);
    const data: InboundItem[] | null = res?.ok ? await res.json() : null;
    return <ul>{data?.map(item => <li key={item.idx}>{item.ganNo}</li>)}</ul>;
}
```

- **useEffect로 불러오는 건 옛 SPA 습관** — 서버 컴포넌트는 `await`가 곧 "페이지 열리면 바로 불러오기"
- GET 파라미터는 `URLSearchParams`로 (값은 전부 문자열)
- ⚠️ 시간 단위: 요청 `startDt`/`endDt`는 **초**, 응답 `reqDt` 등은 **밀리초**. `0`이면 값 없음(1970으로 표시하지 말 것)
- 응답 타입은 컴파일 타임 전용 — 실제 모양과 달라도 런타임엔 조용히 undefined가 된다 (검증이 필요해지면 zod 고려)

### proxy 강화: 존재 체크 → 파싱 검증

```ts
const raw = request.cookies.get("session")?.value;
let session = false;
try { session = !!raw && typeof JSON.parse(raw) === "object"; } catch {}
```

proxy와 getSession의 판정 기준을 일치시켜, 손상된 쿠키로 "가드는 통과했는데 세션은 null"인 유령 상태를 제거.

### 토큰 갱신 시점 확인하는 법

1. **로그는 dev 서버 터미널에서** — apiFetch는 서버에서 실행되므로 console.log도 터미널에 찍힌다 (브라우저 F12 아님!)
2. **만료 시각 미리 알기** — JWT의 exp 클레임 디코드:
   `JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).exp` (초 단위)
3. **기다리지 않고 강제 테스트** — `call(session.accessToken + "x")`로 한 줄 임시 수정하면 즉시 401 → 갱신 발동. 확인 후 원복
4. 첫 갱신 때 `Object.keys(refreshed)`로 **auth/token 응답 모양 확인** — 새 refreshToken도 주는 방식(rotation)이면 그것도 저장해야 두 번째 갱신이 성공한다

## 마이그레이션 중 만난 에러들

| 에러 | 원인 | 해결 |
|---|---|---|
| `Event handlers cannot be passed to Client Component props` | 서버 컴포넌트에서 `onSubmit`에 함수 전달 | 인터랙션 있는 컴포넌트에 `"use client"` |
| `next/headers ... only available in Server Components` | actions.ts에 `"use server"` 누락 → 클라이언트 번들에 포함됨 | 파일 첫 줄에 `"use server"` |
| 로그인 성공했는데 페이지가 안 넘어감 | `secure: true` 쿠키가 http에서 저장 안 될 수 있음(특히 Safari) → proxy가 되튕김 | `secure: NODE_ENV === "production"` |
| `Body is unusable: Body has already been read` | `res.json()`을 두 번 호출 | 한 번 읽어서 변수(`data`)에 담고 재사용 |
| 쿠키에 `"undefined"` 저장됨 | 응답 필드가 `token`이 아니라 `accessToken` | `Object.keys(data)`로 실제 필드명 확인 후 수정 |
| `async/await is not supported in Client Components` | `'use client'` 컴포넌트에 `async` — 쿠키/데이터 조회는 서버 전용 | `'use client'` 제거 (async·cookies·apiFetch → 서버 / onClick·useState → 클라) |
| `getSession`인데 이름/이메일이 undefined | `getSelection()` 오타 — 브라우저 전역 함수와 이름이 겹쳐 import 없이도 "동작하는 척" | 오타 수정 + import 추가. 전역과 겹치는 오타는 에러 없이 조용히 깨진다 |
| 모든 API 호출이 401 | `` `Bearer &{token}` `` — `$`를 `&`로 오타, 토큰이 문자 그대로 전송됨 | `${token}`으로 수정. 템플릿 문자열 보간은 `$` |
| `Cannot find name 'data'` (TS2304) | 핸들러 함수 안의 변수를 렌더링(함수 밖)에서 참조 | 데이터를 컴포넌트 본문(렌더링과 같은 스코프)에서 정의 |
| `Parameter 'item' implicitly has an 'any' type` (TS7006) | `res.json()` 반환 타입을 TS가 모름 | 응답 타입 선언: `const data: InboundItem[] \| null = ...` |
| console.log가 안 보임 | 서버 코드(apiFetch, 액션)의 로그는 브라우저가 아니라 **dev 서버 터미널**에 찍힘 | `npm run dev` 터미널을 볼 것. `VM…:2 <anonymous>` 에러는 브라우저 확장 스크립트 — 무시 |

## 완료된 숙제 ✅

- [x] 로그인 액션의 임시 `console.log` 제거
- [x] 로그아웃 버튼 — `logout()` Server Function + 드롭다운 `onClick` 연결
- [x] 탑메뉴에 사용자 이름/이메일 표시 — `getSession()` → props 릴레이, 아바타는 이름 이니셜
- [x] `Authorization` 헤더 부착 — `lib/api.ts`의 `apiFetch` 관문으로 일원화
- [x] `refreshToken` 갱신 로직 — apiFetch의 401 → `/auth/token` → 1회 재시도
- [x] proxy를 파싱 검증으로 강화 (getSession과 판정 기준 일치)
- [x] 첫 데이터 페이지(`/dtin`) — async 서버 컴포넌트 + `URLSearchParams` + `types.ts`

## 남은 숙제

- [ ] apiFetch의 갱신 디버그 로그 제거 (갱신 동작 확인 후)
- [ ] `auth/token` 응답의 rotation 여부 확인 — 새 refreshToken을 주면 세션에 같이 저장해야 두 번째 갱신이 성공
- [ ] proxy에서 만료 임박 토큰 선갱신 — "렌더링 중 쿠키 저장 불가"로 인한 반복 갱신 해소
- [ ] `user`가 null일 때 마이페이지 분기 (로그인 링크 표시 등)
- [ ] login-form의 데모 잔재 정리 — 죽은 "Sign Up" 버튼, `href="#"` 링크
- [ ] 실서비스 전: 세션 쿠키 `jose` 서명 (위조 방지 — 쿠키의 `auth` 값으로 권한 판단 금지는 그 전에도 유효)
- [ ] 실서비스 전: 로그아웃 시 백엔드 토큰 무효화(revoke 엔드포인트 확인)
