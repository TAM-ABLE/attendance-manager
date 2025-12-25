// frontend/lib/api-client.ts
// 共通APIクライアント - Server Action用

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ErrorCodes, failure, type ApiResult, type ApiError } from "../../shared/types/ApiResponse";

/** デフォルトタイムアウト（30秒） */
const DEFAULT_TIMEOUT = 30000;

interface FetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    cache?: RequestCache;
    revalidate?: number;
    /** リクエストタイムアウト（ミリ秒） */
    timeout?: number;
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
        return failure(ErrorCodes.UNAUTHORIZED, "Not authenticated");
    }

    const { method = "GET", body, cache, revalidate, timeout = DEFAULT_TIMEOUT } = options;

    // タイムアウト用のAbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

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
            signal: controller.signal,
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
            // バックエンドからのエラーレスポンス: { success: false, error: { code, message } }
            const error: ApiError = data.error && typeof data.error === "object" && "code" in data.error
                ? data.error
                : { code: ErrorCodes.INTERNAL_ERROR, message: `Request failed: ${res.status}` };

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

/**
 * キャッシュなしのAPIリクエスト（リアルタイムデータ用）
 */
export async function apiClientNoCache<T>(endpoint: string, options: Omit<FetchOptions, "cache" | "revalidate"> = {}): Promise<ApiResult<T>> {
    return apiClient<T>(endpoint, { ...options, cache: "no-store" });
}
