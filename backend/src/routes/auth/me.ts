// backend/src/routes/auth/me.ts
import { createRoute, z } from "@hono/zod-openapi"
import { createClient } from "@supabase/supabase-js"
import { successResponse, unauthorizedError } from "../../../lib/errors"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import {
  errorResponseSchema,
  successResponseSchema,
  uuidSchema,
} from "../../../lib/openapi-schemas"
import type { Env } from "../../types/env"

const meRouter = createOpenAPIHono<{ Bindings: Env }>()

/**
 * Authorization ヘッダーから Bearer トークンを抽出
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}

const meResponseSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    email: z.email(),
    role: z.enum(["admin", "user"]),
  })
  .openapi("MeResponse")

const meRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["認証"],
  security: [{ Bearer: [] }],
  summary: "現在のユーザー情報を取得",
  description: "Authorization ヘッダーの Bearer トークンを検証し、ユーザー情報を返します。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(meResponseSchema),
        },
      },
      description: "認証済み",
    },
    401: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "未認証",
    },
  },
})

meRouter.openapi(meRoute, async (c) => {
  const authHeader = c.req.header("Authorization")
  const accessToken = extractBearerToken(authHeader)

  if (!accessToken) {
    return unauthorizedError(c, "Not authenticated")
  }

  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return unauthorizedError(c, "Invalid token")
    }

    return successResponse(c, {
      id: user.id,
      name: (user.user_metadata?.name as string) ?? "",
      email: user.email ?? "",
      role: (user.user_metadata?.role as "admin" | "user") ?? "user",
    })
  } catch (err) {
    console.error("Auth me error:", err)
    return unauthorizedError(c, "Invalid token")
  }
})

export default meRouter
