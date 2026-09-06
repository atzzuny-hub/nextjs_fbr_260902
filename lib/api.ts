import "server-only";
import { redirect } from "next/navigation";
import { getSession, getRefreshToken } from "./session";

export async function apiFetch(path: string, init: RequestInit = {}) {
    const token = await getSession();
    if (!token) redirect("/login");

    const call = (t: string) =>
        fetch(`${process.env.API_URL}${path}`, {
            ...init,
            headers: { ...init.headers, Authorization: `Bearer ${t}` },
        });

    let res = await call(token);   // 1차 시도

    if (res.status === 401) {      // 만료 → 갱신 시도
        const refreshToken = await getRefreshToken();
        if (!refreshToken) redirect("/api/logout");

        const refreshRes = await fetch(`${process.env.API_URL}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!refreshRes.ok) redirect("/api/logout");   // 갱신 실패 = 세션 끝

        const { accessToken } = await refreshRes.json();
        // 주의: 렌더링 중이라 쿠키에 저장 불가 — 이 요청 안에서만 사용하고 버려짐
        res = await call(accessToken);                 // 1회 재시도
        if (res.status === 401) redirect("/api/logout"); // 재시도도 401 = 세션 끝
    }

    return res;
}