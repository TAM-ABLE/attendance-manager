// frontend/lib/auth/with-retry.ts
// Server Actions の 401 エラーをクライアント側でハンドリング

import { type ApiResult, ErrorCodes } from "@attendance-manager/shared/types/ApiResponse"

/**
 * Server Action を実行し、401 エラー時はログインページへリダイレクト
 */
export async function withRetry<T>(action: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  const result = await action()

  // 401 エラーの場合、ログインページへリダイレクト
  if (!result.success && result.error.code === ErrorCodes.UNAUTHORIZED) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  return result
}

/**
 * React Query / SWR 用のフェッチャー
 */
export async function withRetryFetcher<T>(action: () => Promise<ApiResult<T>>): Promise<T> {
  const result = await withRetry(action)

  if (!result.success) {
    throw new Error(result.error.message)
  }

  return result.data
}
