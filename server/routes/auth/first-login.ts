import { createRoute } from "@hono/zod-openapi"
import { setCookie } from "hono/cookie"
import { adminUpdateUser, signInWithPassword } from "../../lib/auth-helpers"
import { internalError, successResponse, unauthorizedError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  errorResponseSchema,
  firstLoginRequestSchema,
  firstLoginResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import type { Env } from "../../types/env"

import { ACCESS_TOKEN_MAX_AGE } from "./constants"

const firstLoginRouter = createOpenAPIHono<{ Bindings: Env }>()

const firstLoginRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "初回ログイン（パスワード変更）",
  description: "初期パスワードで認証後、新しいパスワードに変更し、新パスワードでログインします。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: firstLoginRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(firstLoginResponseSchema),
        },
      },
      description: "パスワード変更・ログイン成功",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "バリデーションエラー",
    },
    401: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "認証エラー（初期パスワードが正しくない）",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "サーバーエラー",
    },
  },
})

type SignInResult = Awaited<ReturnType<typeof signInWithPassword>>

firstLoginRouter.openapi(firstLoginRoute, async (c) => {
  const { email, currentPassword, newPassword } = c.req.valid("json")

  // 1. Verify current password
  let currentAuth: SignInResult
  try {
    currentAuth = await signInWithPassword(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      email,
      currentPassword,
    )
  } catch {
    return unauthorizedError(c, "現在のパスワードが正しくありません")
  }

  // 2. Update password + mark as changed via Admin API (single request)
  try {
    await adminUpdateUser(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      currentAuth.user.id,
      {
        password: newPassword,
        user_metadata: { password_changed: true },
      },
    )
  } catch (err) {
    console.error("Password update error:", err instanceof Error ? err.message : err)
    return internalError(c, "Failed to update password")
  }

  // 3. Re-authenticate with new password
  let newAuth: SignInResult
  try {
    newAuth = await signInWithPassword(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      email,
      newPassword,
    )
  } catch (err) {
    console.error("Re-auth error:", err instanceof Error ? err.message : err)
    return internalError(c, "Failed to re-authenticate after password change")
  }

  // 4. Set cookie
  setCookie(c, "accessToken", newAuth.access_token, {
    httpOnly: true,
    secure: c.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  })

  // 5. Return success
  return successResponse(c, {
    user: {
      id: newAuth.user.id,
      name: (newAuth.user.user_metadata?.name as string) ?? "",
      email: newAuth.user.email ?? "",
      role: (newAuth.user.user_metadata?.role as "admin" | "user") ?? "user",
    },
  })
})

export default firstLoginRouter
