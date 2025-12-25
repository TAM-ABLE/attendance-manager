// shared/types/ApiResponse.ts
// 統一されたAPIレスポンス型

/**
 * 成功/失敗を判別可能なAPIレスポンス型（Discriminated Union）
 */
export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; error: ApiError };

/**
 * APIエラー型
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * 標準エラーコード
 */
export const ErrorCodes = {
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    CONFLICT: "CONFLICT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * ApiResultのヘルパー関数
 */
export function success<T>(data: T): ApiResult<T> {
    return { success: true, data };
}

export function failure<T>(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiResult<T> {
    return { success: false, error: { code, message, details } };
}

/**
 * ApiResultがsuccessかどうかをチェック（型ガード）
 */
export function isSuccess<T>(result: ApiResult<T>): result is { success: true; data: T } {
    return result.success;
}

/**
 * ApiResultがfailureかどうかをチェック（型ガード）
 */
export function isFailure<T>(result: ApiResult<T>): result is { success: false; error: ApiError } {
    return !result.success;
}
