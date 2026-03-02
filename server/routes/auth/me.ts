import { createRoute, z } from "@hono/zod-openapi"
import { successResponse } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { unauthorizedResponse } from "../../lib/openapi-responses"
import { successResponseSchema, uuidSchema } from "../../lib/openapi-schemas"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const meRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

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
      content: { "application/json": { schema: successResponseSchema(meResponseSchema) } },
      description: "認証済み",
    },
    401: unauthorizedResponse,
  },
})

meRouter.openapi(meRoute, async (c) => {
  const payload = c.get("jwtPayload")

  return successResponse(c, {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  })
})

export default meRouter
