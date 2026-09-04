
"use server"
import { createSession } from '@/lib/session';


export async function login(prevState: unknown, formData: FormData) {
    
    const email = formData.get('email')
    const password = formData.get('password')

    if(!email || !password) return {error : "이메일, 비밀번호를 입력해주세요"};

    const res = await fetch(`${process.env.API_URL}/auth/login`,{
        method: "POST",
        headers: { 'Content-Type' : 'application/json' },
        body: JSON.stringify({email, password})
    })

    const data = await res.json();

    if(!res.ok) return { error : "이메일, 비밀번호를 확인해주세요"}

    const {accessToken} = data;
    await createSession(accessToken)
}