import { createRoute } from "@hono/zod-openapi"
import { deleteCookie } from "hono/cookie"
import { z } from "zod"
import { successResponse } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { Env } from "../../types/env"

const logoutRouter = createOpenAPIHono<{ Bindings: Env }>()

const logoutResponseSchema = z.object({
  message: z.string(),
})

const logoutSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: logoutResponseSchema,
})

const logoutRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "ログアウト",
  description: "ログアウトし、Cookie を削除します。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: logoutSuccessResponseSchema,
        },
      },
      description: "ログアウト成功",
    },
  },
})

logoutRouter.openapi(logoutRoute, async (c) => {
  deleteCookie(c, "accessToken", { path: "/" })
  return successResponse(c, {
    message: "Logged out successfully",
  })
})

export default logoutRouter
