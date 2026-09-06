
import 'server-only'
import { cookies } from 'next/headers';

export type SessionUser = { name : string; email : string }

const COOKIE_OPTIONS = {
    httpOnly: true,   // 브라우저 JS(document.cookie)에서 접근 불가 → XSS로 토큰 탈취 방지
    secure: process.env.NODE_ENV === "production",   // HTTPS 연결에서만 전송. 개발(http://localhost)에선 꺼야 쿠키가 저장됨
    sameSite: "lax",  // 다른 사이트에서 시작된 요청(폼 제출, 이미지 등)엔 쿠키 미전송, 링크 클릭 이동은 허용 → CSRF 완화
    path: "/",        // 사이트 전체 경로에서 쿠키 전송 (예: "/admin"으로 좁히면 그 하위 경로에만 붙음)
    maxAge: 60 * 60 * 24 * 7,  // 쿠키 수명(초 단위) = 7일. 생략하면 브라우저 닫을 때 사라지는 세션 쿠키가 됨
} as const

export async function createSession(token: string, refreshToken: string, user: SessionUser) {    
    const cookieStore = await cookies()
    cookieStore.set("session", token, COOKIE_OPTIONS);
    cookieStore.set("refresh", refreshToken, COOKIE_OPTIONS);
    cookieStore.set("user", JSON.stringify(user), COOKIE_OPTIONS);
}

export async function getRefreshToken() {
    return (await cookies()).get("refresh")?.value ?? null;
}


export async function getUser(): Promise<SessionUser | null> {
    const raw = (await cookies()).get("user")?.value
    if(!raw) return null;
    try{ return JSON.parse(raw);} catch{return null;}
}

export async function getSession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session");   // { name, value } 또는 undefined
    if (!cookie) return null;
    return cookie.value;
}



export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("refresh");
    cookieStore.delete("user");
}

