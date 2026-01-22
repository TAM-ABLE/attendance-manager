// backend/src/routes/auth/register.ts
import { createRoute } from "@hono/zod-openapi"
import { databaseError, successResponse } from "../../../lib/errors"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import {
  errorResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  successResponseSchema,
} from "../../../lib/openapi-schemas"
import { getSupabaseClient } from "../../../lib/supabase"
import type { Env } from "../../types/env"

const registerRouter = createOpenAPIHono<{ Bindings: Env }>()

const registerRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
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

  // Supabase Auth でユーザー登録
  // プロファイルはトリガー (handle_new_user) で自動作成される
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

  return successResponse(c, {
    accessToken: session.access_token,
    user: {
      id: user.id,
      name: (user.user_metadata?.name as string) ?? "",
      email: user.email ?? "",
      role: (user.user_metadata?.role as "admin" | "user") ?? "user",
    },
  })
})

export default registerRouter
