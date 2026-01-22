// frontend/lib/api-client.ts
// 共通APIクライアント - クライアントサイドfetch用
// 認証が必要なリクエストは /api/proxy 経由で送信
// Next.js Route Handler が Cookie から Authorization ヘッダーに変換して Hono に転送

import { ErrorCodes, failure, type ApiResult, type ApiError } from "@attendance-manager/shared/types/ApiResponse";

/** デフォルトタイムアウト（30秒） */
const DEFAULT_TIMEOUT = 30000;

interface FetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    /** リクエストタイムアウト（ミリ秒） */
    timeout?: number;
}

/**
 * 認証付きAPIリクエストを実行する共通クライアント
 * /api/proxy 経由でリクエストを送信し、Route Handler が Authorization ヘッダーを付与
 *
 * @example
 * // GET リクエスト
 * const result = await apiClient<AttendanceRecord>('/attendance/today');
 *
 * // POST リクエスト
 * const result = await apiClient<{ slack_ts: string }>('/attendance/clock-in', {
 *     method: 'POST',
 *     body: { userName, plannedTasks },
 * });
 */
export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
    const { method = "GET", body, timeout = DEFAULT_TIMEOUT } = options;

    // タイムアウト用のAbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const headers: HeadersInit = {};
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        // /api/proxy 経由で Hono API にリクエスト
        const res = await fetch(`/api/proxy${endpoint}`, fetchOptions);
        const data = await res.json();

        if (!res.ok) {
            // バックエンドからのエラーレスポンス: { success: false, error: { code, message } }
            const error: ApiError = data.error && typeof data.error === "object" && "code" in data.error
                ? data.error
                : { code: res.status === 401 ? ErrorCodes.UNAUTHORIZED : ErrorCodes.INTERNAL_ERROR, message: `Request failed: ${res.status}` };

            return { success: false, error };
        }

        // 成功レスポンス: { success: true, data: ... }
        return { success: true, data: data.data as T };
    } catch (err) {
        // タイムアウトエラーの処理
        if (err instanceof DOMException && err.name === "AbortError") {
            return failure(ErrorCodes.TIMEOUT, "Request timed out");
        }

        console.error(`API Error [${endpoint}]:`, err);
        return failure(ErrorCodes.INTERNAL_ERROR, err instanceof Error ? err.message : "Unknown error");
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============ 認証API ============

type LoginResult = { success: true } | { success: false; error: string };

/**
 * ログイン
 * Next.js Route Handler 経由で認証し、Cookie にトークンを保存
 */
export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "ログインに失敗しました",
            };
        }

        return { success: true };
    } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: "ログインに失敗しました" };
    }
}

type RegisterResult = { success: true } | { success: false; error: string };

/**
 * ユーザー登録
 * Next.js Route Handler 経由で登録し、Cookie にトークンを保存
 */
export async function register(
    name: string,
    email: string,
    password: string,
    employeeNumber: string,
    role: "admin" | "user" = "user"
): Promise<RegisterResult> {
    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, employeeNumber, role }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "登録に失敗しました",
            };
        }

        return { success: true };
    } catch (err) {
        console.error("Register error:", err);
        return { success: false, error: "登録に失敗しました" };
    }
}

/**
 * ログアウト
 * Next.js Route Handler で Cookie を削除
 */
export async function logout(): Promise<void> {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
        });
    } catch (err) {
        console.error("Logout error:", err);
    }
}
