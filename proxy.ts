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