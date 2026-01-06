// frontend/stores/auth.ts
// シンプルな認証状態管理（localStorage 不使用）

import { create } from "zustand";
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    type AuthUser,
} from "@/lib/auth/api";

type AuthState = {
    user: AuthUser | null;
    isLoading: boolean;
};

type AuthActions = {
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    setUser: (user: AuthUser | null) => void;
    setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
    user: null,
    isLoading: true,

    login: async (email, password) => {
        const result = await apiLogin(email, password);
        if (result.success) {
            set({ user: result.data.user });
            return { success: true };
        }
        return { success: false, error: result.error };
    },

    register: async (name, email, password) => {
        const result = await apiRegister(name, email, password);
        if (result.success) {
            set({ user: result.data.user });
            return { success: true };
        }
        return { success: false, error: result.error };
    },

    logout: async () => {
        await apiLogout();
        set({ user: null });
    },

    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),
}));
