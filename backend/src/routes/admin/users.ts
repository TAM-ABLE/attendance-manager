import { parseYearMonth } from "@attendance-manager/shared/lib/time"
// backend/src/routes/admin/users.ts
import { createRoute, z } from "@hono/zod-openapi"
import { databaseError, successResponse, validationError } from "../../../lib/errors"
import { formatAttendanceRecord } from "../../../lib/formatters"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
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
} from "../../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const usersRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const nullResponseSchema = z.null().openapi({ description: "null" })

// GET /admin/users - ユーザー一覧
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

// GET /admin/users/:userId/attendance/month/:yearMonth - ユーザーの月次勤怠
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

// GET /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション取得
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

    // Convert to schema format (null instead of undefined)
    const sessions = data.work_sessions.map((s) => ({
      id: s.id,
      clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
      clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
      breaks: s.breaks.map((b) => ({
        id: b.id,
        start: b.break_start ? new Date(b.break_start).getTime() : null,
        end: b.break_end ? new Date(b.break_end).getTime() : null,
      })),
    }))

    return successResponse(c, sessions)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

// PUT /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション更新
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
    // attendance_records を取得 or 作成
    const { id: attendanceId } = await repos.attendance.findOrCreateRecord(userId, date)

    // 既存データ削除
    const oldSessionIds = await repos.workSession.getSessionIdsByAttendanceId(attendanceId)
    if (oldSessionIds.length > 0) {
      await repos.break.deleteBySessionIds(oldSessionIds)
      await repos.workSession.deleteByIds(oldSessionIds)
    }

    // バリデーション（先に全てチェック）
    const validSessions = sessions.filter((s) => s.clockIn != null)
    for (const s of validSessions) {
      if (s.clockOut && s.clockOut < s.clockIn!) {
        return validationError(c, "Clock out time must be after clock in time")
      }
      for (const br of s.breaks || []) {
        if (!br.start) continue
        if (br.end && br.end < br.start) {
          return validationError(c, "Break end time must be after break start time")
        }
        // 休憩がセッション時間内かチェック
        if (br.start < s.clockIn!) {
          return validationError(c, "Break start time must be after clock in time")
        }
        if (s.clockOut && br.end && br.end > s.clockOut) {
          return validationError(c, "Break end time must be before clock out time")
        }
      }
    }

    // work_sessions を一括挿入
    if (validSessions.length > 0) {
      const insertedSessions = await repos.workSession.insertMultiple(
        attendanceId,
        validSessions.map((s) => ({
          clockIn: new Date(s.clockIn!).toISOString(),
          clockOut: s.clockOut ? new Date(s.clockOut).toISOString() : null,
        })),
      )

      // breaks を一括挿入
      const breakInserts: { sessionId: string; breakStart: string; breakEnd: string | null }[] = []
      for (let i = 0; i < validSessions.length; i++) {
        const sessionId = insertedSessions[i].id
        for (const br of validSessions[i].breaks || []) {
          if (!br.start) continue
          breakInserts.push({
            sessionId,
            breakStart: new Date(br.start).toISOString(),
            breakEnd: br.end ? new Date(br.end).toISOString() : null,
          })
        }
      }

      if (breakInserts.length > 0) {
        await repos.break.insertMultiple(breakInserts)
      }
    }

    return successResponse(c, null)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default usersRouter
