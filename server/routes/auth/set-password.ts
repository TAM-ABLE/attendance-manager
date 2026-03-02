import { createRoute } from "@hono/zod-openapi"
import { setCookie } from "hono/cookie"
import { adminUpdateUser, signInWithPassword, verifyJwt } from "../../lib/auth-helpers"
import { internalError, successResponse, unauthorizedError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../../lib/openapi-responses"
import {
  setPasswordRequestSchema,
  setPasswordResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import type { Env } from "../../types/env"

import { ACCESS_TOKEN_MAX_AGE } from "./constants"

const setPasswordRouter = createOpenAPIHono<{ Bindings: Env }>()

const setPasswordRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "パスワード設定（招待メールから）",
  description: "招待メールのトークンを使用してパスワードを設定し、ログインします。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: setPasswordRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(setPasswordResponseSchema) } },
      description: "パスワード設定・ログイン成功",
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
})

setPasswordRouter.openapi(setPasswordRoute, async (c) => {
  const { accessToken, newPassword } = c.req.valid("json")

  // 1. Verify the invite token to get userId and email
  let userId: string
  let email: string
  try {
    const payload = await verifyJwt(accessToken, c.env.JWT_SECRET)
    userId = payload.sub
    email = payload.email
  } catch {
    return unauthorizedError(c, "招待リンクが無効または期限切れです")
  }

  // 2. Update password + mark as changed via Admin API
  try {
    await adminUpdateUser(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, userId, {
      password: newPassword,
      user_metadata: { password_changed: true },
    })
  } catch (err) {
    console.error("Password update error:", err instanceof Error ? err.message : err)
    return internalError(c, "パスワードの設定に失敗しました")
  }

  // 3. Re-authenticate with new password to get session
  let newAuth: Awaited<ReturnType<typeof signInWithPassword>>
  try {
    newAuth = await signInWithPassword(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      email,
      newPassword,
    )
  } catch (err) {
    console.error("Re-auth error:", err instanceof Error ? err.message : err)
    return internalError(c, "パスワード設定後の認証に失敗しました")
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

export default setPasswordRouter
