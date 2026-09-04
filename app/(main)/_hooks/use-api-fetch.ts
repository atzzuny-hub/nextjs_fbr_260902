'use client'

import { useCallback } from "react";
import { useAuth } from "../_components/auth-provider";
import { useRouter } from "next/navigation";


export function useApiFetch(){

    const {user, setUser} = useAuth()
    const router = useRouter()
    
    return useCallback(async( path: string, init: RequestInit = {} )=>{

        if(!user) return null

        const call = (token:string) => 
            fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`,{
                ...init,
                headers:{ ...init.headers, Authorization: `Bearer ${token}`},
            });
        
        
        let res = await call(user.accessToken) // 1차 시도

        if( res.status === 401){ // 만료 → 갱신
            const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: user.refreshToken }),
            });

            // 갱신 실패 = 세션 끝
            if(!refreshRes.ok){
                setUser(null)
                router.replace("/login");
                return null
            }

            const refreshed = await refreshRes.json()
            setUser({...user, accessToken: refreshed.accessToken})
            res = await call(refreshed.accessToken);          // 1회 재시도
        }

        if (res.status === 401) {                             // 재시도도 401 = 세션 끝
            setUser(null);
            router.replace("/login");
            return null;
        }

        return res;

    },[user, setUser, router])
}