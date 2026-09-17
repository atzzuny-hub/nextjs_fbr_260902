"use client"
import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "local-storage";

function subscribe(cb: () => void) {
    window.addEventListener("storage", cb);   // 다른 탭에서 바뀔 때
    window.addEventListener(EVENT, cb);       // 이 탭에서 set/clear 할 때
    return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(EVENT, cb);
    };
}

function read(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
}

export function useLocalStorageState<T>(key: string, fallback: T) {
    const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

    const value = useMemo<T>(() => {
        try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
    }, [raw, fallback]);

    const set = useCallback((next: T) => {
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(EVENT));
    }, [key]);

    const clear = useCallback(() => {
        localStorage.removeItem(key);
        window.dispatchEvent(new Event(EVENT));
    }, [key]);

    return [value, set, clear] as const;
}