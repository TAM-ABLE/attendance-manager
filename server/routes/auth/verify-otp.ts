import { createRoute, z } from "@hono/zod-openapi"
import { verifyOtp } from "../../lib/auth-helpers"
import { internalError, successResponse } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import { successResponseSchema } from "../../lib/openapi-schemas"
import type { Env } from "../../types/env"

const verifyOtpRequestSchema = z
  .object({
    tokenHash: z.string().min(1).openapi({
      description: "メールリンクに含まれるトークンハッシュ",
    }),
    type: z.enum(["invite", "recovery"]).openapi({
      description: "トークンの種類",
    }),
  })
  .openapi("VerifyOtpRequest")

const verifyOtpResponseSchema = z
  .object({
    accessToken: z.string().openapi({
      description: "アクセストークン",
    }),
  })
  .openapi("VerifyOtpResponse")

const verifyOtpRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],
  security: [],
  summary: "OTPトークン検証",
  description: "メールリンクのトークンハッシュを検証してアクセストークンを取得します。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: verifyOtpRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(verifyOtpResponseSchema) },
      },
      description: "検証成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

const verifyOtpRouter = createOpenAPIHono<{ Bindings: Env }>()

verifyOtpRouter.openapi(verifyOtpRoute, async (c) => {
  const { tokenHash, type } = c.req.valid("json")

  try {
    const result = await verifyOtp(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      token_hash: tokenHash,
      type,
    })

    return successResponse(c, { accessToken: result.access_token })
  } catch (err) {
    console.error("Verify OTP error:", err instanceof Error ? err.message : err)
    return internalError(c, "トークンが無効または期限切れです")
  }
})

export default verifyOtpRouter
