"use server";   // 이 한 줄이 없으면 클라이언트 번들로 끌려가서 next/headers 에러

import { createSession, deleteSession } from "@/lib/session";
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

    if (!res.ok) return { error: "이메일, 비밀번호를 확인해주세요" };

    const data = await res.json();   // body는 한 번만 읽을 수 있다!

    const { accessToken } = data;    // 실제 응답 필드명 확인 필수 (token 아님)
    await createSession(accessToken, data.refreshToken, { name: data.name, email: data.email });
    redirect("/dashboard");          // throw 방식 — 이 뒤 코드는 실행 안 됨
}

export async function logout() {
    await deleteSession();     // 도구함에서 지우개 꺼내 쓰기 — 반드시 먼저!
    redirect("/login");        // redirect는 throw 방식 — 이 뒤 코드는 실행 안 됨
}