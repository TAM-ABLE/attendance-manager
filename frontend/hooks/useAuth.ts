// frontend/hooks/useAuth.ts

"use client";

import { useAuthStore } from "@/stores/auth";

/**
 * 認証状態を管理するフック
 */
export function useAuth() {
    const { user, isLoading, login, register, logout } = useAuthStore();

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
    };
}
