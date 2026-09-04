# 클라이언트 인증 구현 노트 (localStorage 방식)

> 로그인 → 전역 상태(Context) → 가드 → 로그아웃 → 데이터 조회 → 토큰 재갱신 → 관문 훅 추출.
> 전부 브라우저(클라이언트)에서 처리하는 방식으로 처음부터 다시 구현한 기록 (2026-09-04).
> 서버(httpOnly 쿠키) 방식은 [auth-refactoring.md](./auth-refactoring.md) 참고 — 이 문서는 그 대칭 구조를 클라이언트에서 완주한 것.

## 큰 그림

```
[로그인 폼] ──성공──▶ localStorage("user")
                          │
                          ▼
[AuthProvider]  localStorage를 구독해서 전역 상태로 (useSyncExternalStore)
      │
      ├─ [AuthGuard]     user 없으면 /login으로 (클라이언트 가드)
      ├─ [MypageMenu]    useAuth()로 이름/로그아웃
      └─ [useApiFetch]   토큰 부착 + 401이면 갱신 + 1회 재시도 (모든 API의 관문)
                          │
                          ▼
                     [dtin 등 데이터 페이지]
```

핵심 규칙 하나: **토큰이 브라우저(localStorage)에 있으므로, 토큰을 쓰는 코드는 전부 클라이언트 컴포넌트(`'use client'`)여야 한다.** 서버 컴포넌트는 localStorage를 영영 읽을 수 없다.

---

## 1. Login — 일단 한 파일에 전부 넣어본다

클라이언트 컴포넌트 하나가 검증·API 호출·저장·이동·로딩·가드를 모두 처리한다.

### 응답 타입 먼저 — `app/login/types.ts`

```ts
/** POST /auth/login 요청 body */
export type LoginRequest = {
    email: string;
    password: string;
};

/** POST /auth/login 성공 응답 */
export type LoginResponse = {
    email: string;
    name: string;
    auth: string;
    accessToken: string;
    refreshToken: string;
    tmzn: number;
    utc: number;
    webClientIds: string[];
};
```

> **왜 타입부터?** `const data: LoginResponse = await res.json()`으로 받으면
> 필드명 실수(`token`? `accessToken`?)를 런타임이 아니라 에디터에서 잡는다.
> API req/res 타입은 그 API를 쓰는 라우트 옆(`app/login/types.ts`)에 두는 게 규칙.

### 폼 — `app/login/_components/login-form.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginResponse } from "../types";

export default function LoginForm(){
    const router = useRouter()
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [errMessage, setErrMessage] = useState<string>('')

    // 이미 로그인 상태면 로그인 페이지 대신 dashboard로
    useEffect(()=>{
        const localUser = localStorage.getItem('user')
        if(!localUser) return
        router.replace('/dashboard')
    },[router])

    const handleClickSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setErrMessage('')

        // ① 검증 먼저 (setLoading보다 앞에! 순서 바뀌면 early return 시 버튼이 영원히 잠김)
        if(!email || !password){
            setErrMessage('이메일, 비밀번호를 입력해주세요.')
            return
        }

        try{
            setLoading(true)   // ② 로딩은 fetch 직전에

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({email, password})
            })

            // ③ res.ok 체크는 res.json()보다 먼저 — 401도 fetch 입장에선 "성공"이다
            if(!res.ok){
                setErrMessage('이메일, 비밀번호를 확인해주세요.')
                return
            }

            const data: LoginResponse = await res.json()

            localStorage.setItem('user', JSON.stringify(data))
            router.replace('/dashboard')

        }catch(err){
            // ④ catch에 오는 건 네트워크 장애 — "비밀번호 확인" 메시지를 쓰면 사용자가 오해한다
            console.log(err);
            setErrMessage('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }finally{
            setLoading(false)   // ⑤ finally에는 이것만! (setErrMessage('') 넣으면 에러가 안 보이게 됨)
        }
    }

    return(
        <Card className="w-full max-w-sm">
            {/* ...Card UI 생략 (shadcn login-01 블록)... */}
            <form onSubmit={handleClickSubmit}>
                {/* Input들은 value + onChange로 제어 */}
                {errMessage && <p className="mt-5 text-destructive">{errMessage}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '로그인중...' : '로그인'}
                </Button>
            </form>
        </Card>
    )
}
```

> **⚠️ 이 단계에서 겪은 함정들** (번호는 위 코드의 주석과 대응)
> - **③ fetch는 401/500을 예외로 던지지 않는다.** 서버가 응답만 주면 fetch는 "성공"이고,
>   catch는 네트워크 자체가 죽었을 때만 발동한다. 그래서 `res.ok` 체크는 필수.
> - **⑤ finally는 return을 해도 무조건 실행된다.** try 안에서 `return`하든 throw하든
>   finally는 지나간다. 여기에 `setErrMessage('')`를 두면 방금 설정한 에러 메시지를
>   즉시 지워버려서 "에러가 절대 화면에 안 보이는" 버그가 된다.
> - **① setLoading(true)를 검증보다 먼저 하면**, 빈 입력으로 early return할 때
>   `setLoading(false)`를 지나치지 않아 버튼이 영원히 비활성화된다.

---

## 2. user 전역 공유 — React Context

user 정보는 페이지마다 사용될 것이기 때문에, 페이지마다 `localStorage.getItem`을 반복하는 대신
**React Context로 "한 번 읽어서 전역에 올려두고, 모든 컴포넌트가 구독"** 하게 한다.

### ⚠️ useEffect 방식의 문제점

처음엔 이렇게 썼다:

```tsx
// ❌ React 19에서 에러가 나는 패턴
useEffect(()=>{
    const raw = localStorage.getItem('user')
    if(!raw) return
    try{
        setUser(JSON.parse(raw));
    }catch{}
},[])
```

React 19의 새 진단에 걸린다:

```
Error: Calling setState synchronously within an effect can trigger cascading renders
```

effect 본문에서 동기적으로 setState를 부르면 "렌더 → effect → setState → 또 렌더"로
**모든 마운트가 무조건 두 번 렌더링**되기 때문. React 공식 문서는 localStorage 같은
**외부 저장소 구독에는 `useSyncExternalStore`를 권장**한다 — 에러 메시지의
"Subscribe for updates from some external system"이 정확히 이 얘기다.

### 변경 — `app/(main)/_components/auth-provider.tsx`

```tsx
'use client'

import { LoginResponse } from "@/app/login/types"
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"

const STORAGE_KEY = "user"
const AUTH_EVENT = "auth-changed"

// localStorage 변경을 구독 — React가 "값이 바뀌면 알려달라"고 등록하는 부분
function subscribe(callback: () => void) {
    window.addEventListener("storage", callback);      // 다른 탭에서 바뀔 때
    window.addEventListener(AUTH_EVENT, callback);     // 같은 탭에서 바뀔 때
    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(AUTH_EVENT, callback);
    };
}

type AuthContextValue = {
    user: LoginResponse | null;
    setUser : (u : LoginResponse | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({children}:{children: React.ReactNode}){

    const raw = useSyncExternalStore(
        subscribe,
        () => localStorage.getItem(STORAGE_KEY),   // 클라이언트에서 읽는 값
        () => null,                                // 서버 렌더링 중의 값 (localStorage 없음)
    )

    // 스냅샷은 문자열(raw)로 받고 파싱은 useMemo로!
    const user = useMemo<LoginResponse | null>(()=>{
        if(!raw) return null
        try{ return JSON.parse(raw)}catch{return null}
    },[raw])

    // 저장/삭제 + "바뀌었다" 알림까지 한 곳에서
    const setUser = useCallback((u: LoginResponse | null)=>{
        if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
        else localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event(AUTH_EVENT)) // 구독자(React)에게 알림
    }, [])

    return(
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다");
    return ctx;
}
```

> **이 코드가 돌아가는 원리**
> - `useSyncExternalStore(구독, 클라값, 서버값)` — 서버 렌더링 중엔 3번째 인자(null)로 그리고,
>   브라우저로 넘어오면 2번째 인자로 localStorage를 읽는다. hydration 불일치 없음.
> - **스냅샷이 문자열인 이유**: `getSnapshot`이 매번 새 객체를 반환하면(안에서 JSON.parse하면)
>   React가 "계속 바뀐다"고 착각해 무한 렌더 루프에 빠진다. 문자열은 내용이 같으면 같은 값.
>   파싱은 `useMemo`로 raw가 바뀔 때만.
> - **AUTH_EVENT를 직접 쏘는 이유**: 브라우저의 `storage` 이벤트는 "다른 탭"에서 바뀔 때만
>   발생한다. 같은 탭에서 setItem한 건 스스로 알림을 쏴야 React가 알아챈다.
>   (덤: 다른 탭에서 로그아웃하면 이 탭도 즉시 반영된다.)
> - **localStorage를 직접 만지지 말 것** — 저장·삭제·알림이 `setUser` 한 곳에 모여 있어야
>   "지웠는데 화면엔 이름이 남아 있는" 불일치가 안 생긴다.

### 레이아웃에 연결 — `app/(main)/layout.tsx`

```tsx
import { AuthProvider } from "./_components/auth-provider";
import TopMenu from "./_components/top-menu";

export default function Layout({children}:{children:React.ReactNode}){
    return(
        <AuthProvider>
            <div>
                <TopMenu/>
                {children}
            </div>
        </AuthProvider>
    )
}
```

레이아웃은 서버 컴포넌트여도 된다 — 서버가 클라이언트 Provider로 자식을 감싸는 건 정상 패턴.
페이지 이동은 클라이언트 내비게이션이라 레이아웃(과 Context)이 유지되므로 **localStorage는
앱 진입 시 한 번만 읽는다.**

### 사용하기

```tsx
'use client'
import { useAuth } from "@/app/(main)/_components/auth-provider";

export default function MypageMenu() {
    const { user } = useAuth();
    // ...
    return <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
}
```

> ⚠️ `useAuth()`는 **AuthProvider 안쪽에서만** 호출할 수 있다. Provider를 레이아웃에
> 감싸기 전에 먼저 쓰면 방어 코드가 만든 에러("AuthProvider 안에서만...")가 난다.
> 에러가 나면 코드가 아니라 **연결 순서**를 의심할 것.

---

## 3. 클라이언트 가드 — AuthGuard

지금 상태의 구멍: 로그아웃 후 주소창에 `/dashboard`를 직접 치거나 뒤로가기를 누르면
페이지가 그냥 열린다 (user가 null이라 이름만 빈 채로). **클라이언트 저장소 방식의 태생적
한계**고, 서버 방식에서 proxy(경비원)가 해결하던 부분이다. 이 단계에서 막으려면
"user가 null이면 /login으로 replace"하는 클라이언트 가드를 넣는다 — 깜빡임이 있는
임시방편이라는 걸 알고 쓰기.

### 함정 두 개 — 그냥 `if (!user) redirect`로는 안 된다

1. **첫 렌더링에서 user는 "항상" null이다 — 로그인돼 있어도.**
   useSyncExternalStore의 서버 스냅샷(`() => null`)으로 첫 화면을 그린 뒤에 클라이언트
   값으로 갈아타기 때문. null만 보고 바로 쫓아내면 로그인한 사용자까지 /login으로 튕긴다.
   **"아직 확인 전(null)"과 "진짜 비로그인(null)"을 구분**해야 한다.
2. 그 구분을 흔히 `useState(false)` + `useEffect(() => setMounted(true))`로 하는데 —
   이건 위에서 만난 **"setState in effect" 진단에 또 걸린다.** 같은 훅으로 우아하게 피한다.

### `app/(main)/_components/auth-guard.tsx`

```tsx
"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { useEffect, useSyncExternalStore } from "react"

const emptySubscribe = () => () => {};   // 구독할 외부 변화 없음

export default function AuthGuard({children}:{children:React.ReactNode}){
    const {user} = useAuth()
    const router = useRouter()

    // 서버에선 false, 클라이언트에선 true — "hydration 끝났는지" 감지의 공식 패턴
    const hydrated = useSyncExternalStore(
        emptySubscribe,
        () => true,    // 클라이언트 스냅샷
        () => false,   // 서버 스냅샷
    );

    useEffect(() => {
        if (hydrated && !user) {
            router.replace("/login");
        }
    }, [hydrated, user, router]);

    return <>{children}</>
}
```

> - `emptySubscribe`는 import가 아니라 **같은 파일에 정의하는 한 줄짜리 상수**다.
>   컴포넌트 밖(모듈 레벨)에 두는 이유: 렌더마다 새 함수면 매번 재구독하기 때문.
> - `useEffect` 안의 `router.replace`는 setState가 아니라서 진단에 안 걸린다.
> - **개선 여지**: 지금은 redirect가 완료되기 전까지 보호된 내용이 잠깐 보인다.
>   `return` 앞에 `if (!hydrated || !user) return null;`을 넣으면 확인 전/비로그인
>   상태에서 내용을 숨겨 깜빡임까지 막을 수 있다.

### 레이아웃 최종 — `app/(main)/layout.tsx`

```tsx
import AuthGuard from "./_components/auth-guard";
import { AuthProvider } from "./_components/auth-provider";
import TopMenu from "./_components/top-menu";

export default function Layout({children}:{children:React.ReactNode}){
    return(
        <AuthProvider>
            <AuthGuard>
                <TopMenu/>
                {children}
            </AuthGuard>
        </AuthProvider>
    )
}
```

`AuthGuard`는 `useAuth()`를 쓰므로 **반드시 AuthProvider 안쪽**이어야 하고,
`<TopMenu/>`도 Guard 안에 있어야 탑메뉴(의 자식들)가 useAuth를 쓸 수 있다.

---

## 4. 로그아웃

```tsx
const { user, setUser } = useAuth()
const router = useRouter()

const handleClickLogout = async() => {
    if (!user) return;

    try{
        // 서버에 로그아웃 통보 — 실패해도 로컬 로그아웃은 진행된다
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,{
            method: 'POST',
            headers:{
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${user.accessToken}`
            },
            body: JSON.stringify({ refreshToken: user.refreshToken })
        })
    }catch(err){
        console.log(err);
    }finally{
        setUser(null)              // 항상, 딱 한 번 (localStorage 삭제 + 알림까지)
        router.replace('/login')
    }
}
```

> - **엔드포인트 주의: `/auth/logout`이다.** 처음에 `/auth/token`(재갱신)을 불렀는데,
>   그건 "떠나면서 새 토큰을 발급받는" 정반대 동작이다. 로그아웃 통보와 토큰 갱신은
>   완전히 다른 엔드포인트.
> - **finally에 정리를 딱 한 번** — finally는 try를 어떻게 떠나든(정상/return/throw)
>   무조건 실행되므로, "서버 호출이 실패해도 로컬은 무조건 로그아웃"이라는 fail-open
>   설계가 자연스럽게 완성된다. try 안에 setUser를 또 쓰면 이중 실행.
> - `localStorage.removeItem`을 직접 부르지 않고 `setUser(null)`을 쓰는 이유는
>   Provider 섹션의 "직접 만지지 말 것"과 같다.

---

## 5. Dtin 데이터 불러오기

GET 쿼리 파라미터는 **`URLSearchParams`로 만들어서 `?`로 붙인다.**

```tsx
'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { InboundItem } from "./types"
import { useAuth } from "../_components/auth-provider"

export default function DtinPage(){
    const {user} = useAuth()
    const [data, setData] = useState<InboundItem[]>([])

    const handleClickData = async() => {
        const param = new URLSearchParams({
            wmsLinkId : '-100', // URLSearchParams는 값이 전부 문자열이어야 함
            startDt : '1787788800',
            endDt : '1788479999',
            searchDt : 'REQ_DT',
            pageNo : '0',
            pageSize : '300'
        })

        if(!user) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dtin?${param.toString()}`,{
            method:"GET",
            headers:{
                'Content-Type':'application/json',
                "Authorization": `Bearer ${user.accessToken}`
            }
        })

        if (!res.ok) return;          // 일단 최소 방어 (나중에 에러 표시 추가)

        setData(await res.json());
    }

    return(
        <div>
            <Button onClick={handleClickData}>SEARCH DATA</Button>
            <div>
                {data.map((v)=> (<div key={v.dataId}>{v.clntName}</div>))}
            </div>
        </div>
    )
}
```

> - **URL에 객체를 그대로 넣으면 안 된다.** `` `/dtin/${param}` ``처럼 쓰면 객체가
>   `"[object Object]"` 문자열이 되어 존재하지 않는 주소로 요청이 나간다.
>   fetch 주변에서 객체는 항상 변환을 거친다: **body는 `JSON.stringify(객체)`,
>   URL 쿼리는 `new URLSearchParams(객체)`.**
> - 버튼 클릭으로 조회하는 구조는 클라이언트 컴포넌트에선 정상 패턴이다.
>   (예전에 에러났던 건 **서버 컴포넌트**에 onClick을 달아서였다.)
> - **로그 위치 주의**: 이 코드는 `'use client'` — 브라우저에서 실행되므로 console.log가
>   **브라우저 콘솔(F12)**에 찍힌다. 서버 코드(Server Function, 서버 컴포넌트)는 터미널.
>   코드가 어디서 실행되느냐로 판단할 것.

---

## 6. 토큰 재갱신

흐름: **"401이면 갱신 한 번 → 성공하면 재시도 한 번, 갱신마저 실패면 로그아웃."**
재시도가 "딱 1번"인 게 중요하다 — 반복하면 무한 루프.

```tsx
const handleClickData = async() => {
    if(!user) return;

    const param = new URLSearchParams({
        wmsLinkId : '-100',
        startDt : '1787788800',
        endDt : '1788479999',
        searchDt : 'REQ_DT',
        pageNo : '0',
        pageSize : '300'
    })

    // ── 1차 시도 ──  (재시도 결과로 갈아끼우므로 const가 아니라 let)
    let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dtin?${param.toString()}`,{
        method:"GET",
        headers:{
            'Content-Type':'application/json',
            "Authorization": `Bearer ${user.accessToken}`
            // 갱신 테스트용 강제 401: `Bearer ${user.accessToken}x`
        }
    })

    // ── 401이면 갱신 + 재시도 ──
    if (res.status === 401){
        console.log('갱신요청');

        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`,{
            method: "POST",
            headers:{"Content-Type": 'application/json'},
            body: JSON.stringify({refreshToken: user.refreshToken})
            // "갱신도 실패" 테스트: refreshToken: user.refreshToken + "x"
        })

        // 갱신 자체가 실패 = 세션 종료
        if(!refreshRes.ok){
            setUser(null)
            router.replace('/login')
            return
        }

        const refreshed = await refreshRes.json()
        setUser({...user, accessToken: refreshed.accessToken})

        // 딱 1번 재시도
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dtin?${param.toString()}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${refreshed.accessToken}`,   // ← 유일하게 달라지는 부분
            },
        });
    }

    // ── ★ 재시도까지 끝난 "최종 res"를 판정 (위치가 중요 — 401 블록 뒤!) ──
    if (res.status === 401) {          // 갱신까지 했는데도 401 = 세션 끝
        setUser(null);
        router.replace('/login');
        return;
    }
    if(!res.ok){                       // 401 외의 실패 (500, 403 등)
        console.log('요청실패', res.status);
        return
    }

    // 성공
    setData(await res.json());
}
```

> - **재시도 헤더에는 `refreshed.accessToken`을 써야 한다.** `setUser`로 저장은 했지만
>   지금 실행 중인 함수 안의 `user` 변수는 여전히 옛 토큰을 든 옛 객체다
>   (state 갱신은 다음 렌더링부터 반영). 제일 틀리기 쉬운 부분.
> - **최종 판정 블록의 순서**: 401(세션 문제) 먼저, `!res.ok`(그 외) 나중.
>   401도 `!res.ok`에 걸리므로 순서를 바꾸면 세션 만료가 일반 실패 로그로 삼켜진다.
>   그리고 이 블록은 반드시 401 처리 블록 **뒤**에 — 앞에 두면 정상적인 갱신 대상(1차 401)까지
>   로그아웃시킨다.
> - **테스트 방법** (주석 처리된 두 줄):
>   - 갱신 성공 경로: 1차 헤더에만 `x` → 401 → `갱신요청` 로그 → 재시도 성공
>   - 갱신 실패(로그아웃) 경로: 1차 헤더 `x` + refreshToken에도 `x` → 갱신 401 → /login 이동
>   - 확인 후 `x`는 반드시 원복!
> - **"401이 안 뜨는데?"** — 토큰이 아직 유효한 것. 만료 시각은 브라우저 콘솔에서 확인:
>   `new Date(JSON.parse(atob(JSON.parse(localStorage.getItem('user')).accessToken.split('.')[1])).exp * 1000)`
>   (이 스니펫은 콘솔 전용 — 소스에 넣으면 타입 에러 + 서버 렌더링에서 죽는다.)

---

## 7. 관문 훅으로 추출 — useApiFetch

토큰 재갱신은 이 페이지만 쓰는 게 아니다. 페이지마다 위의 긴 코드를 복붙할 수는 없으니
**모든 API 호출이 지나가는 "관문"을 훅으로** 만든다. user/setUser(Context)와 router가
필요해서 일반 함수가 아니라 커스텀 훅이다.

### `app/(main)/_hooks/use-api-fetch.ts`

```tsx
'use client'

import { useCallback } from "react";
import { useAuth } from "../_components/auth-provider";
import { useRouter } from "next/navigation";

export function useApiFetch(){
    const {user, setUser} = useAuth()
    const router = useRouter()

    return useCallback(async( path: string, init: RequestInit = {} )=>{
        if(!user) return null

        // 토큰만 갈아끼울 수 있는 요청 함수
        const call = (token:string) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`,{
                ...init,
                headers:{ ...init.headers, Authorization: `Bearer ${token}`},
            });

        let res = await call(user.accessToken)   // 1차 시도

        if( res.status === 401){                 // 만료 → 갱신
            const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: user.refreshToken }),
            });

            if(!refreshRes.ok){                  // 갱신 실패 = 세션 끝
                setUser(null)
                router.replace("/login");
                return null
            }

            const refreshed = await refreshRes.json()
            setUser({...user, accessToken: refreshed.accessToken})
            res = await call(refreshed.accessToken);   // 1회 재시도
        }

        if (res.status === 401) {                // 재시도도 401 = 세션 끝
            setUser(null);
            router.replace("/login");
            return null;
        }

        return res;
    },[user, setUser, router])
}
```

> - **`useCallback`으로 감싸는 이유**: 반환 함수가 렌더마다 새로 만들어지면, 이 함수를
>   `useEffect` 의존성에 넣는 순간 무한 루프가 된다. user가 바뀔 때만 새로 만든다.
> - **`return null` 규약**: 세션이 끝나 로그인으로 보낸 경우 null — 쓰는 쪽은 `res?.ok`로 받는다.
> - **`call(token)` 클로저**: 1차 시도와 재시도의 유일한 차이(토큰)만 인자로 뽑아낸 것.
>   URL/파라미터를 두 곳에서 관리하지 않게 된다.
> - **위치가 `(main)/_hooks`인 이유**: 이 훅은 useAuth에 의존하고 AuthProvider는 (main)
>   레이아웃에만 있다 — 사용 가능 범위를 파일 위치가 그대로 말해준다. (`_` 접두사 폴더는
>   라우팅에서 제외.)
> - ⚠️ 파일명 오타 조심 — 처음에 `use-api-fecth.ts`로 만들어서 한동안 오타 경로로 import했다.
>   다음 페이지에서 기억대로 `use-api-fetch`를 import하는 순간 module not found.

### 그러면 페이지는 이만큼 짧아진다 — `app/(main)/dtin/page.tsx`

```tsx
'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { InboundItem } from "./types"
import { useApiFetch } from "../_hooks/use-api-fetch"

export default function DtinPage(){
    const apiFetch = useApiFetch();
    const [data, setData] = useState<InboundItem[]>([])

    const handleClickData = async() => {
        const param = new URLSearchParams({
            wmsLinkId : '-100',
            startDt : '1787788800',
            endDt : '1788479999',
            searchDt : 'REQ_DT',
            pageNo : '0',
            pageSize : '300'
        })

        const res = await apiFetch(`/dtin?${param.toString()}`);
        if (!res?.ok) {
            console.log('요청실패', res?.status);
            return;
        }
        setData(await res.json());
    }

    return(
        <div>
            <Button onClick={handleClickData}>SEARCH DATA</Button>
            <div>
                {data.map((v)=> (<div key={v.dataId}>{v.clntName}</div>))}
            </div>
        </div>
    )
}
```

토큰 부착, 401 감지, 갱신, 재시도, 세션 만료 처리 — 전부 훅 안으로 사라졌다.
다음 페이지(dtob 등)는 `useApiFetch()` 한 줄 + `apiFetch("/경로?쿼리")` 호출이 전부.
갱신 정책이 바뀌어도 훅 파일 하나만 고치면 된다.

---

## 오늘 만난 함정 모음 (요약)

| 증상 | 원인 | 교훈 |
|---|---|---|
| 에러 메시지가 절대 안 보임 | finally의 `setErrMessage('')` | **finally는 return해도 실행된다** |
| 틀린 비밀번호도 로그인됨 | `res.ok` 체크 누락 | **fetch는 401을 예외로 안 던진다** |
| setState 진단 에러 | effect에서 동기 setState | 외부 저장소는 **useSyncExternalStore** |
| 로그인해도 /login으로 튕김(가드) | 첫 렌더의 user는 항상 null | hydrated 감지로 "확인 전"과 구분 |
| 요청이 이상한 주소로 감 | URL에 객체 보간 → `[object Object]` | 쿼리는 URLSearchParams, body는 JSON.stringify |
| 갱신 후 재시도도 401 | 재시도에 옛 `user.accessToken` 사용 | state는 다음 렌더부터 — **refreshed 값 직접 사용** |
| console.log가 안 보임 | 보는 곳이 반대 | 클라이언트 코드 → 브라우저 콘솔, 서버 코드 → 터미널 |
| 갱신 로그가 영영 안 찍힘 | 토큰이 아직 유효 (30초 설정 미반영) | JWT exp 디코드로 실제 만료 확인 |
| 로그아웃했는데 새 토큰 발급 | `/auth/token`(갱신)과 `/auth/logout` 혼동 | 엔드포인트 의미 확인 |

## 남은 일

- [ ] 백엔드 accessToken 30초 설정 반영 후, 진짜 만료로 갱신 흐름 통과 확인 (`갱신요청` 로그 → 데이터 정상)
- [ ] `/auth/token` 응답에 새 refreshToken도 오는지(rotation) 확인 — 오면 `setUser`에 같이 저장
- [ ] AuthGuard에 숨김 처리(`if (!hydrated || !user) return null`) 추가 검토
- [ ] dtob 등 두 번째 페이지에서 useApiFetch 재사용 — 관문 구조 검증
- [ ] 실서비스 전환 시: 이 문서의 구조 전체가 [auth-refactoring.md](./auth-refactoring.md)의 httpOnly 쿠키 방식으로 대체된다 (Provider→getSession, AuthGuard→proxy, useApiFetch→서버 apiFetch)
