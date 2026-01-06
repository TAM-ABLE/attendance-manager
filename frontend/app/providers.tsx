"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { fetchMe } from "@/lib/auth/api";

export function Providers({ children }: { children: React.ReactNode }) {
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);

    useEffect(() => {
        fetchMe().then((result) => {
            if (result.success) {
                setUser(result.data);
            }
            setLoading(false);
        });
    }, [setUser, setLoading]);

    return <>{children}</>;
}
