import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonthWithRange, todayJSTString } from "@/lib/time"
import { handleRouteError, successResponse, validationError } from "../../lib/errors"
import { formatAttendanceRecord } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  attendanceRecordSchema,
  successResponseSchema,
  taskSchema,
  weekTotalResponseSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const queriesRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

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
        "application/json": { schema: successResponseSchema(attendanceRecordSchema.nullable()) },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
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
    return handleRouteError(c, e)
  }
})

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
        "application/json": { schema: successResponseSchema(z.array(attendanceRecordSchema)) },
      },
      description: "取得成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

queriesRouter.openapi(monthRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { yearMonth } = c.req.valid("param")

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

const weekTotalRoute = createRoute({
  method: "get",
  path: "/week/total",
  tags: ["勤怠"],
  summary: "週間勤務時間取得",
  description: "今週の勤務時間合計を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(weekTotalResponseSchema) } },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

queriesRouter.openapi(weekTotalRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")

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
    const netWorkMs = await attendance.calculateNetWorkMsByDateRange(userId, startDate, endDate)

    return successResponse(c, { netWorkMs })
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const todayPlannedTasksRoute = createRoute({
  method: "get",
  path: "/today/planned-tasks",
  tags: ["勤怠"],
  summary: "本日の予定タスク取得",
  description: "本日の出勤時に入力した予定タスクを取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(z.array(taskSchema)) } },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

queriesRouter.openapi(todayPlannedTasksRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const report = await repos.dailyReport.findUnsubmittedReportWithTasks(userId, date)
    if (!report) {
      return successResponse(c, [])
    }

    const plannedTasks = report.tasks
      .filter((t) => t.taskType === "planned")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({ taskName: t.taskName, hours: t.hours }))

    return successResponse(c, plannedTasks)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default queriesRouter
