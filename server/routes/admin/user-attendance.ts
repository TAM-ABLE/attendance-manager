import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonthWithRange } from "@/lib/time"
import { handleRouteError, successResponse, validationError } from "../../lib/errors"
import { formatAttendanceRecord, getFormattedSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  attendanceRecordSchema,
  dateSchema,
  nullResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  uuidSchema,
  workSessionSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const userAttendanceRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// ===== GET /admin/users/:userId/attendance/month/:yearMonth =====

const getUserMonthlyRoute = createRoute({
  method: "get",
  path: "/{userId}/attendance/month/{yearMonth}",
  tags: ["管理者"],
  summary: "ユーザーの月別勤怠取得",
  description: "指定ユーザーの月別勤怠記録を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
      yearMonth: yearMonthSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(z.array(attendanceRecordSchema)) },
      },
      description: "取得成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

userAttendanceRouter.openapi(getUserMonthlyRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonthWithRange(yearMonth)
  if (!parsed) return validationError(c, "Invalid year-month format")
  const { start, end } = parsed

  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordsByDateRange(userId, start, end)
    c.header("Cache-Control", "private, max-age=60")
    return successResponse(c, data.map(formatAttendanceRecord))
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// ===== GET /admin/users/:userId/attendance/:date/sessions =====

const getUserSessionsRoute = createRoute({
  method: "get",
  path: "/{userId}/attendance/{date}/sessions",
  tags: ["管理者"],
  summary: "ユーザーの特定日のセッション取得",
  description: "指定ユーザーの特定日のセッション一覧を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
      date: dateSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(z.array(workSessionSchema)) },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

userAttendanceRouter.openapi(getUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)
    return successResponse(c, getFormattedSessions(data))
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// ===== PUT /admin/users/:userId/attendance/:date/sessions =====

const updateUserSessionsRoute = createRoute({
  method: "put",
  path: "/{userId}/attendance/{date}/sessions",
  tags: ["管理者"],
  summary: "ユーザーの特定日のセッション更新",
  description: "指定ユーザーの特定日のセッションを一括更新します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
      date: dateSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: updateSessionsRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(nullResponseSchema) } },
      description: "更新成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

userAttendanceRouter.openapi(updateUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { sessions } = c.req.valid("json")
  const repos = createRepos(c.env)

  try {
    const result = await replaceSessions(repos, userId, date, sessions)
    if (result.error) {
      return validationError(c, result.error)
    }
    return successResponse(c, null)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default userAttendanceRouter
