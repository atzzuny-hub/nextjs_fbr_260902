"use server";   // 이 한 줄이 없으면 클라이언트 번들로 끌려가서 next/headers 에러

import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { loginSchema } from "./schema";

export async function login(prevState: unknown, formData: FormData) {
    
    // const email = formData.get("email");
    // const password = formData.get("password");
    // if (!email || !password) return { error: "이메일, 비밀번호를 입력해주세요." };

    const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password")
    })

    if(!parsed.success){

        const fieldErrors: Record<string, string> = {};
        for( const issue of parsed.error.issues){
            const field = String(issue.path[0]);
            fieldErrors[field] ??= issue.message
        }
        return {fieldErrors}
    }

    const {email, password} = parsed.data;

    // ...기존 fetch → createSession → redirect 그대로...

    const res = await fetch(`${process.env.API_URL}/auth/login`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return { error: "이메일, 비밀번호를 확인해주세요" };

    const data = await res.json();  

    const { accessToken } = data;   
    await createSession(accessToken, data.refreshToken, { name: data.name, email: data.email });
    redirect("/dashboard");          
}

export async function logout() {
    await deleteSession();    
    redirect("/login");       
}