// lib/api-client.ts
// 共通APIクライアント - クライアントサイドfetch用
// Cookie は Hono ミドルウェアが直接読み取るため proxy 不要

import { type ApiError, type ApiResult, ErrorCodes, failure } from "@/types/ApiResponse"

/** デフォルトタイムアウト（30秒） */
const DEFAULT_TIMEOUT = 30000

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  /** リクエストタイムアウト（ミリ秒） */
  timeout?: number
  /** ブラウザキャッシュをバイパスする（更新後のリフェッチ用） */
  noCache?: boolean
}

/**
 * 認証付きAPIリクエストを実行する共通クライアント
 * /api/* に直接リクエストし、Hono ミドルウェアが Cookie から認証トークンを読み取る
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body, timeout = DEFAULT_TIMEOUT, noCache = false } = options

  // タイムアウト用のAbortController
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const headers: HeadersInit = {}
    if (body) {
      headers["Content-Type"] = "application/json"
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      ...(noCache && { cache: "no-store" as RequestCache }),
    }

    if (body) {
      fetchOptions.body = JSON.stringify(body)
    }

    const res = await fetch(`/api${endpoint}`, fetchOptions)
    const data = await res.json()

    if (!res.ok) {
      // バックエンドからのエラーレスポンス: { success: false, error: { code, message } }
      const error: ApiError =
        data.error && typeof data.error === "object" && "code" in data.error
          ? data.error
          : {
              code: res.status === 401 ? ErrorCodes.UNAUTHORIZED : ErrorCodes.INTERNAL_ERROR,
              message: `Request failed: ${res.status}`,
            }

      return { success: false, error }
    }

    // 成功レスポンス: { success: true, data: ... }
    return { success: true, data: data.data as T }
  } catch (err) {
    // タイムアウトエラーの処理
    if (err instanceof DOMException && err.name === "AbortError") {
      return failure(ErrorCodes.TIMEOUT, "Request timed out")
    }

    console.error(`API Error [${endpoint}]:`, err)
    return failure(ErrorCodes.INTERNAL_ERROR, err instanceof Error ? err.message : "Unknown error")
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============ 認証API ============

type LoginResult = { success: true } | { success: false; error: string }

/**
 * ログイン
 * Hono API が Cookie にトークンを保存
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error?.message ?? "ログインに失敗しました",
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Login error:", err)
    return { success: false, error: "ログインに失敗しました" }
  }
}

/**
 * メールリンクのトークンハッシュを検証してアクセストークンを取得
 */
export async function verifyOtp(
  tokenHash: string,
  type: "invite" | "recovery",
): Promise<{ success: true; accessToken: string } | { success: false; error: string }> {
  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenHash, type }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error?.message ?? "トークンの検証に失敗しました",
      }
    }

    return { success: true, accessToken: json.data.accessToken }
  } catch (err) {
    console.error("Verify OTP error:", err)
    return { success: false, error: "トークンの検証に失敗しました" }
  }
}

/**
 * パスワード設定（招待メールのトークンを使用）
 * トークンで認証後、新パスワードを設定してログイン
 */
export async function setPassword(accessToken: string, newPassword: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, newPassword }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error?.message ?? "パスワード設定に失敗しました",
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Set password error:", err)
    return { success: false, error: "パスワード設定に失敗しました" }
  }
}

/**
 * ログアウト
 * Hono API が Cookie を削除
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    })
  } catch (err) {
    console.error("Logout error:", err)
  }
}
