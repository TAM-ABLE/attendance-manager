// frontend/lib/auth/with-retry.ts
// Server Actions の 401 エラーをクライアント側でハンドリング

import { ErrorCodes, type ApiResult } from "@attendance-manager/shared/types/ApiResponse";
import { useAuthStore } from "@/stores/auth";

/**
 * Server Action を実行し、401 エラー時はログアウト状態にする
 */
export async function withRetry<T>(
    action: () => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
    const result = await action();

    // 401 エラーの場合、ログアウト状態にする
    if (!result.success && result.error.code === ErrorCodes.UNAUTHORIZED) {
        useAuthStore.getState().setUser(null);
    }

    return result;
}

/**
 * React Query / SWR 用のフェッチャー
 */
export async function withRetryFetcher<T>(
    action: () => Promise<ApiResult<T>>
): Promise<T> {
    const result = await withRetry(action);

    if (!result.success) {
        throw new Error(result.error.message);
    }

    return result.data;
}
