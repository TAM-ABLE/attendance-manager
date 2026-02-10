import { OpenAPIHono } from "@hono/zod-openapi"
import type { Env } from "hono/types"

export function createOpenAPIHono<E extends Env = Env>() {
  return new OpenAPIHono<E>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const firstIssue = result.error.issues[0]
        const message = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Validation failed"
        return c.json(
          {
            success: false as const,
            error: { code: "VALIDATION_ERROR", message },
          },
          400,
        )
      }
    },
  })
}
