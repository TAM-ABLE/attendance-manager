import type { Context } from "hono"
import { ErrorCodes } from "@/types/ApiResponse"
import { GoTrueError } from "./auth-helpers"
import { DatabaseError } from "./repositories/errors"
import { ResendError } from "./resend"

// ===== 成功レスポンス =====

export function successResponse<T>(c: Context, data: T) {
  return c.json({ success: true as const, data }, 200)
}

// ===== エラーレスポンス =====

export function unauthorizedError(c: Context, message = "Unauthorized") {
  return c.json({ success: false as const, error: { code: ErrorCodes.UNAUTHORIZED, message } }, 401)
}

export function forbiddenError(c: Context, message = "Forbidden") {
  return c.json({ success: false as const, error: { code: ErrorCodes.FORBIDDEN, message } }, 403)
}

export function notFoundError(c: Context, resource: string) {
  return c.json(
    {
      success: false as const,
      error: { code: ErrorCodes.NOT_FOUND, message: `${resource} not found` },
    },
    404,
  )
}

export function validationError(c: Context, message: string, details?: Record<string, unknown>) {
  const error = details
    ? { code: ErrorCodes.VALIDATION_ERROR, message, details }
    : { code: ErrorCodes.VALIDATION_ERROR, message }
  return c.json({ success: false as const, error }, 400)
}

export function databaseError(c: Context, internalMessage?: string) {
  if (internalMessage) {
    console.error("Database error:", internalMessage)
  }
  return c.json(
    {
      success: false as const,
      error: { code: ErrorCodes.DATABASE_ERROR, message: "Database operation failed" },
    },
    500,
  )
}

export function internalError(c: Context, internalMessage?: string) {
  if (internalMessage) {
    console.error("Internal error:", internalMessage)
  }
  return c.json(
    {
      success: false as const,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: "Internal server error" },
    },
    500,
  )
}

// ===== ルートハンドラ用エラーハンドリング =====

export function handleRouteError(c: Context, e: unknown) {
  if (e instanceof DatabaseError) return databaseError(c, e.message)
  throw e
}

/**
 * 管理者ルート用の共通エラーハンドリング
 * dbErrorAsNotFound を指定すると、DatabaseError を 404 として返す（ユーザーIDで検索する操作向け）
 */
export function handleAdminRouteError(
  c: Context,
  e: unknown,
  opts?: { dbErrorAsNotFound?: string },
) {
  if (e instanceof DatabaseError) {
    return opts?.dbErrorAsNotFound
      ? notFoundError(c, opts.dbErrorAsNotFound)
      : databaseError(c, e.message)
  }
  if (e instanceof GoTrueError) return internalError(c, e.message)
  if (e instanceof ResendError) return internalError(c, `Email送信エラー: ${e.message}`)
  return internalError(c, e instanceof Error ? e.message : "Unknown error")
}
