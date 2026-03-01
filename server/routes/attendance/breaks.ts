import { createRoute } from "@hono/zod-openapi"
import { todayJSTString } from "@/lib/time"
import { handleRouteError, successResponse, validationError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  breakEndRequestSchema,
  breakStartRequestSchema,
  nullResponseSchema,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const breaksRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const breakStartRoute = createRoute({
  method: "post",
  path: "/start",
  tags: ["勤怠"],
  summary: "休憩開始",
  description: "休憩を開始します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: breakStartRequestSchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(nullResponseSchema) } },
      description: "休憩開始成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

async function getActiveSessionForBreak(
  repos: ReturnType<typeof createRepos>,
  userId: string,
  date: string,
) {
  const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
  if (!record) return { ok: false, error: "No attendance record for today" } as const
  const session = await repos.workSession.findActiveSession(record.id)
  if (!session) return { ok: false, error: "No active session" } as const
  const activeBreak = await repos.break.findActiveBreak(session.id)
  return { ok: true, session, activeBreak } as const
}

breaksRouter.openapi(breakStartRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const body = c.req.valid("json")
  const breakStartTime = body?.breakStartTime
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const ctx = await getActiveSessionForBreak(repos, userId, date)
    if (!ctx.ok) return validationError(c, ctx.error)
    if (ctx.activeBreak) return validationError(c, "Break already in progress")

    await repos.break.startBreak(ctx.session.id, breakStartTime ?? new Date().toISOString())

    return successResponse(c, null)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const breakEndRoute = createRoute({
  method: "post",
  path: "/end",
  tags: ["勤怠"],
  summary: "休憩終了",
  description: "休憩を終了します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: breakEndRequestSchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(nullResponseSchema) } },
      description: "休憩終了成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

breaksRouter.openapi(breakEndRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const body = c.req.valid("json")
  const breakEndTime = body?.breakEndTime
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const ctx = await getActiveSessionForBreak(repos, userId, date)
    if (!ctx.ok) return validationError(c, ctx.error)
    if (!ctx.activeBreak) return validationError(c, "No active break to end")

    await repos.break.endBreak(ctx.activeBreak.id, breakEndTime ?? new Date().toISOString())

    return successResponse(c, null)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default breaksRouter
