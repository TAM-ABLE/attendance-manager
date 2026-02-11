import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonth } from "@/lib/time"
import { databaseError, successResponse, validationError } from "../../lib/errors"
import { formatAttendanceRecord, formatWorkSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  attendanceRecordSchema,
  dateSchema,
  errorResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  userListResponseSchema,
  uuidSchema,
  workSessionSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const usersRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const nullResponseSchema = z.null().openapi({ description: "null" })

const getUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["管理者"],
  summary: "ユーザー一覧取得",
  description: "全ユーザーの一覧を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(userListResponseSchema),
        },
      },
      description: "取得成功",
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

usersRouter.openapi(getUsersRoute, async (c) => {
  const { profile } = createRepos(c.env)

  try {
    const data = await profile.findAllUsers()

    const users = data.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      employeeNumber: u.employee_number,
    }))

    return successResponse(c, users)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

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
        "application/json": {
          schema: successResponseSchema(z.array(attendanceRecordSchema)),
        },
      },
      description: "取得成功",
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

usersRouter.openapi(getUserMonthlyRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonth(yearMonth)
  if (!parsed) {
    return validationError(c, "Invalid year-month format")
  }
  const { year, month } = parsed

  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordsByDateRange(userId, start, end)
    return successResponse(c, data.map(formatAttendanceRecord))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

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
        "application/json": {
          schema: successResponseSchema(z.array(workSessionSchema)),
        },
      },
      description: "取得成功",
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

usersRouter.openapi(getUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)

    if (!data?.work_sessions || !Array.isArray(data.work_sessions)) {
      return successResponse(c, [])
    }

    return successResponse(c, formatWorkSessions(data.work_sessions))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

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
      content: {
        "application/json": {
          schema: successResponseSchema(nullResponseSchema),
        },
      },
      description: "更新成功",
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

usersRouter.openapi(updateUserSessionsRoute, async (c) => {
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
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default usersRouter
