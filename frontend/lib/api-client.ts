// frontend/lib/api-client.ts
// 共通APIクライアント - Server Action用
// 401 エラー時は再ログインが必要

import { cookies } from "next/headers";
import { ErrorCodes, failure, type ApiResult, type ApiError } from "@attendance-manager/shared/types/ApiResponse";

/** デフォルトタイムアウト（30秒） */
const DEFAULT_TIMEOUT = 30000;

/**
 * Server Actions用のベースURL取得
 * Server Actionsはサーバー側で実行されるため、絶対URLが必要
 */
function getServerBaseUrl(): string {
    // Vercel環境
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // 開発環境
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

interface FetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    cache?: RequestCache;
    revalidate?: number;
    /** リクエストタイムアウト（ミリ秒） */
    timeout?: number;
}

/**
 * Cookie からアクセストークンを取得
 */
async function getTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get("accessToken")?.value ?? null;
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
    const token = await getTokenFromCookie();

    if (!token) {
        return failure(ErrorCodes.UNAUTHORIZED, "Not authenticated");
    }

    return executeRequest<T>(endpoint, token, options);
}

/**
 * 実際の API リクエストを実行
 */
async function executeRequest<T>(
    endpoint: string,
    token: string,
    options: FetchOptions
): Promise<ApiResult<T>> {
    // rewritesを経由するため、/api/backendプレフィックスを使用
    const apiUrl = `${getServerBaseUrl()}/api/backend`;
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

/**
 * キャッシュなしのAPIリクエスト（リアルタイムデータ用）
 */
export async function apiClientNoCache<T>(endpoint: string, options: Omit<FetchOptions, "cache" | "revalidate"> = {}): Promise<ApiResult<T>> {
    return apiClient<T>(endpoint, { ...options, cache: "no-store" });
}
