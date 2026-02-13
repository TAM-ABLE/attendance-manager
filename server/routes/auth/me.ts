import { createRoute, z } from "@hono/zod-openapi"
import { getCookie } from "hono/cookie"
import { verifyJwt } from "../../lib/auth-helpers"
import { successResponse, unauthorizedError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { errorResponseSchema, successResponseSchema, uuidSchema } from "../../lib/openapi-schemas"
import type { Env } from "../../types/env"

const meRouter = createOpenAPIHono<{ Bindings: Env }>()

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
  description:
    "Authorization ヘッダーの Bearer トークンまたは Cookie を検証し、ユーザー情報を返します。",
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
  let accessToken = extractBearerToken(authHeader)
  if (!accessToken) {
    accessToken = getCookie(c, "accessToken") ?? null
  }

  if (!accessToken) {
    return unauthorizedError(c, "Not authenticated")
  }

  try {
    const payload = await verifyJwt(accessToken, c.env.JWT_SECRET)

    return successResponse(c, {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    })
  } catch (err) {
    console.error("Auth me error:", err)
    return unauthorizedError(c, "Invalid token")
  }
})

export default meRouter
