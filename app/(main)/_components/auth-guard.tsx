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