import { createRoute } from "@hono/zod-openapi"
import { setCookie } from "hono/cookie"
import { signInWithPassword } from "../../lib/auth-helpers"
import { successResponse, unauthorizedError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  errorResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
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
  const { email, password } = c.req.valid("json")

  try {
    const data = await signInWithPassword(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
      email,
      password,
    )

    setCookie(c, "accessToken", data.access_token, {
      httpOnly: true,
      secure: c.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    })

    return successResponse(c, {
      user: {
        id: data.user.id,
        name: (data.user.user_metadata?.name as string) ?? "",
        email: data.user.email ?? "",
        role: (data.user.user_metadata?.role as "admin" | "user") ?? "user",
      },
    })
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : err)
    return unauthorizedError(c, "Invalid credentials")
  }
})

export default loginRouter
