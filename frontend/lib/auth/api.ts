// frontend/lib/auth/api.ts
// HttpOnly Cookie ベースの認証 API クライアント

const API_URL = "/api/backend";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
};

export type AuthResponse = {
    accessToken: string;
    user: AuthUser;
};

export type AuthResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * 現在のユーザー情報を取得
 */
export async function fetchMe(): Promise<AuthResult<AuthUser>> {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            credentials: "include",
        });

        if (!res.ok) {
            return { success: false, error: "Not authenticated" };
        }

        const json = await res.json();

        if (!json.success) {
            return { success: false, error: json.error?.message ?? "Failed to fetch user" };
        }

        return { success: true, data: json.data as AuthUser };
    } catch (err) {
        console.error("FetchMe error:", err);
        return { success: false, error: "Failed to fetch user" };
    }
}

/**
 * ログイン
 */
export async function login(
    email: string,
    password: string
): Promise<AuthResult<AuthResponse>> {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "ログインに失敗しました",
            };
        }

        return { success: true, data: json.data as AuthResponse };
    } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: "ログインに失敗しました" };
    }
}

/**
 * ユーザー登録
 */
export async function register(
    name: string,
    email: string,
    password: string
): Promise<AuthResult<AuthResponse>> {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
            credentials: "include",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "登録に失敗しました",
            };
        }

        return { success: true, data: json.data as AuthResponse };
    } catch (err) {
        console.error("Register error:", err);
        return { success: false, error: "登録に失敗しました" };
    }
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
    } catch (err) {
        console.error("Logout error:", err);
    }
}
