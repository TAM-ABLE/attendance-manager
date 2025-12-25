// backend/lib/errors.ts
// 統一されたエラーレスポンスユーティリティ

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ErrorCodes, type ErrorCode, type ApiError } from "../../shared/types/ApiResponse";

/**
 * 統一されたエラーレスポンスを返す
 */
export function errorResponse(
    c: Context,
    code: ErrorCode,
    message: string,
    status: ContentfulStatusCode,
    details?: Record<string, unknown>
) {
    const error: ApiError = { code, message };
    if (details) {
        error.details = details;
    }
    return c.json({ success: false, error }, status);
}

/**
 * 成功レスポンスを返す
 */
export function successResponse<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
    return c.json({ success: true, data }, status);
}

// ===== よく使うエラーレスポンスのショートカット =====

export function unauthorizedError(c: Context, message = "Unauthorized") {
    return errorResponse(c, ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbiddenError(c: Context, message = "Forbidden") {
    return errorResponse(c, ErrorCodes.FORBIDDEN, message, 403);
}

export function notFoundError(c: Context, resource: string) {
    return errorResponse(c, ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
}

export function validationError(c: Context, message: string, details?: Record<string, unknown>) {
    return errorResponse(c, ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function databaseError(c: Context, internalMessage?: string) {
    if (internalMessage) {
        console.error("Database error:", internalMessage);
    }
    return errorResponse(c, ErrorCodes.DATABASE_ERROR, "Database operation failed", 500);
}

export function internalError(c: Context, internalMessage?: string) {
    if (internalMessage) {
        console.error("Internal error:", internalMessage);
    }
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, "Internal server error", 500);
}

export function conflictError(c: Context, message: string) {
    return errorResponse(c, ErrorCodes.CONFLICT, message, 409);
}
