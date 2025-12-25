// frontend/lib/api-client.ts
// 共通APIクライアント - Server Action用

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { ApiResult, ApiError } from "../../shared/types/ApiResponse";

interface FetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    cache?: RequestCache;
    revalidate?: number;
}

/**
 * 認証付きAPIリクエストを実行する共通クライアント
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
 *
 * // キャッシュ制御付き
 * const result = await apiClient<AttendanceRecord[]>('/attendance/month/2024-01', {
 *     revalidate: 300, // 5分間キャッシュ
 * });
 */
export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) {
        return {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        };
    }

    const { method = "GET", body, cache, revalidate } = options;

    try {
        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
            method,
            headers,
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        if (cache) {
            fetchOptions.cache = cache;
        }

        // Next.js の revalidate オプション
        if (revalidate !== undefined) {
            fetchOptions.next = { revalidate };
        }

        const res = await fetch(`${apiUrl}${endpoint}`, fetchOptions);
        const data = await res.json();

        if (!res.ok) {
            // バックエンドからのエラーレスポンス
            let error: ApiError;

            if (data.error && typeof data.error === "object" && "code" in data.error) {
                // 新形式: { success: false, error: { code, message } }
                error = data.error;
            } else if (typeof data.error === "string") {
                // 旧形式: { error: "message" }
                error = { code: "INTERNAL_ERROR", message: data.error };
            } else {
                error = { code: "INTERNAL_ERROR", message: `Request failed: ${res.status}` };
            }

            return { success: false, error };
        }

        // 新しい形式: { success: true, data: ... }
        if (data.success === true && "data" in data) {
            return { success: true, data: data.data as T };
        }

        // 後方互換性: 直接データが返ってくる場合
        return { success: true, data: data as T };
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        return {
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: err instanceof Error ? err.message : "Unknown error",
            },
        };
    }
}

/**
 * キャッシュなしのAPIリクエスト（リアルタイムデータ用）
 */
export async function apiClientNoCache<T>(endpoint: string, options: Omit<FetchOptions, "cache" | "revalidate"> = {}): Promise<ApiResult<T>> {
    return apiClient<T>(endpoint, { ...options, cache: "no-store" });
}
