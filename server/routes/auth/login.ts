import { createRoute } from "@hono/zod-openapi"
import { setCookie } from "hono/cookie"
import { successResponse, unauthorizedError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  errorResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import { getSupabaseClient } from "../../lib/supabase"
import type { Env } from "../../types/env"

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7

const loginRouter = createOpenAPIHono<{ Bindings: Env }>()

const loginRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "ログイン",
  description: "メールアドレスとパスワードでログインし、JWTトークンを取得します。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(loginResponseSchema),
        },
      },
      description: "ログイン成功",
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
      description: "認証エラー",
    },
  },
})

loginRouter.openapi(loginRoute, async (c) => {
  const supabase = getSupabaseClient(c.env)
  const { email, password } = c.req.valid("json")

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    console.error("Login error:", error?.message, error?.status, error)
    return unauthorizedError(c, "Invalid credentials")
  }

  const { user, session } = data

  setCookie(c, "accessToken", session.access_token, {
    httpOnly: true,
    secure: c.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  })

  return successResponse(c, {
    user: {
      id: user.id,
      name: (user.user_metadata?.name as string) ?? "",
      email: user.email ?? "",
      role: (user.user_metadata?.role as "admin" | "user") ?? "user",
    },
  })
})

export default loginRouter
