'use client'

import { LoginResponse } from "@/app/login/types"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"


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

    const user = useMemo<LoginResponse | null>(()=>{
        if(!raw) return null
        try{ return JSON.parse(raw)}catch{return null}
    },[raw])

    const setUser = useCallback((u: LoginResponse | null)=>{
        if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
        else localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event(AUTH_EVENT)) // 구독자(React)에게 "바뀌었다" 알림
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