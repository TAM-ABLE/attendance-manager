// backend/lib/errors.ts
// 統一されたエラーレスポンスユーティリティ

import type { Context } from "hono";
import { ErrorCodes } from "@attendance-manager/shared/types/ApiResponse";

// ===== 成功レスポンス =====

/**
 * 成功レスポンスを返す
 */
export function successResponse<T>(c: Context, data: T) {
    return c.json({ success: true as const, data }, 200);
}

/**
 * 警告付き成功レスポンスを返す
 */
export function successResponseWithWarnings<T>(c: Context, data: T, warnings: string[]) {
    return c.json({ success: true as const, data, warnings }, 200);
}

// ===== エラーレスポンス =====

export function unauthorizedError(c: Context, message = "Unauthorized") {
    return c.json(
        { success: false as const, error: { code: ErrorCodes.UNAUTHORIZED, message } },
        401
    );
}

export function forbiddenError(c: Context, message = "Forbidden") {
    return c.json(
        { success: false as const, error: { code: ErrorCodes.FORBIDDEN, message } },
        403
    );
}

export function notFoundError(c: Context, resource: string) {
    return c.json(
        { success: false as const, error: { code: ErrorCodes.NOT_FOUND, message: `${resource} not found` } },
        404
    );
}

export function validationError(c: Context, message: string, details?: Record<string, unknown>) {
    const error = details
        ? { code: ErrorCodes.VALIDATION_ERROR, message, details }
        : { code: ErrorCodes.VALIDATION_ERROR, message };
    return c.json({ success: false as const, error }, 400);
}

export function databaseError(c: Context, internalMessage?: string) {
    if (internalMessage) {
        console.error("Database error:", internalMessage);
    }
    return c.json(
        { success: false as const, error: { code: ErrorCodes.DATABASE_ERROR, message: "Database operation failed" } },
        500
    );
}

export function internalError(c: Context, internalMessage?: string) {
    if (internalMessage) {
        console.error("Internal error:", internalMessage);
    }
    return c.json(
        { success: false as const, error: { code: ErrorCodes.INTERNAL_ERROR, message: "Internal server error" } },
        500
    );
}

export function conflictError(c: Context, message: string) {
    return c.json(
        { success: false as const, error: { code: ErrorCodes.CONFLICT, message } },
        409
    );
}
