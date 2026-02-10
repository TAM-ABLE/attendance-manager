import { createRoute } from "@hono/zod-openapi"
import { setCookie } from "hono/cookie"
import { databaseError, successResponse } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  errorResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import { getSupabaseClient } from "../../lib/supabase"
import type { Env } from "../../types/env"

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7

const registerRouter = createOpenAPIHono<{ Bindings: Env }>()

const registerRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "ユーザー登録",
  description: "新規ユーザーを登録します。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(registerResponseSchema),
        },
      },
      description: "登録成功",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "バリデーションエラー",
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

registerRouter.openapi(registerRoute, async (c) => {
  const supabase = getSupabaseClient(c.env)
  const { email, password, name, employeeNumber, role } = c.req.valid("json")

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: role ?? "user",
        employee_number: employeeNumber,
      },
    },
  })

  if (error || !data.user || !data.session) {
    return databaseError(c, error?.message ?? "Registration failed")
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

export default registerRouter
