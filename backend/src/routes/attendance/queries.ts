import { parseYearMonth, todayJSTString } from "@attendance-manager/shared/lib/time"
// backend/src/routes/attendance/queries.ts
import { createRoute, z } from "@hono/zod-openapi"
import { databaseError, successResponse, validationError } from "../../../lib/errors"
import { formatAttendanceRecord } from "../../../lib/formatters"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import {
  attendanceRecordSchema,
  errorResponseSchema,
  successResponseSchema,
  weekTotalResponseSchema,
  yearMonthSchema,
} from "../../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const queriesRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// GET /attendance/today
const todayRoute = createRoute({
  method: "get",
  path: "/today",
  tags: ["勤怠"],
  summary: "本日の勤怠取得",
  description: "本日の勤怠記録を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(attendanceRecordSchema.nullable()),
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

queriesRouter.openapi(todayRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const date = todayJSTString()
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)

    if (!data) {
      return successResponse(c, null)
    }

    return successResponse(c, formatAttendanceRecord(data))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

// GET /attendance/month/:yearMonth
const monthRoute = createRoute({
  method: "get",
  path: "/month/{yearMonth}",
  tags: ["勤怠"],
  summary: "月別勤怠取得",
  description: "指定月の勤怠記録を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
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

queriesRouter.openapi(monthRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { yearMonth } = c.req.valid("param")

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

// GET /attendance/week/total
const weekTotalRoute = createRoute({
  method: "get",
  path: "/week/total",
  tags: ["勤怠"],
  summary: "週間勤務時間取得",
  description: "今週の勤務時間合計を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(weekTotalResponseSchema),
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

queriesRouter.openapi(weekTotalRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")

  // 今週の月曜日と日曜日を計算
  const date = new Date()
  const dayOfWeek = date.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startDate = monday.toISOString().split("T")[0]
  const endDate = sunday.toISOString().split("T")[0]

  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordsByDateRange(userId, startDate, endDate)

    // formatAttendanceRecordで変換・計算し、workTotalMsを集計
    const netWorkMs = data.reduce((sum, rec) => {
      const formatted = formatAttendanceRecord(rec)
      return sum + formatted.workTotalMs
    }, 0)

    return successResponse(c, { netWorkMs })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default queriesRouter
