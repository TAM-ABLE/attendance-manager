import { createRoute, z } from "@hono/zod-openapi"
import { TASK_TYPE_ACTUAL, TASK_TYPE_PLANNED } from "@/lib/constants"
import { getJSTWeekRange, parseYearMonthWithRange, todayJSTString } from "@/lib/time"
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
import { mergeTasksByName } from "../../lib/task-merge"
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

  const { start: startDate, end: endDate } = getJSTWeekRange()

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
  description: "現在のセッションで入力した予定タスクを取得します。",
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
    // 現在のアクティブセッションの予定タスクのみ返す
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) return successResponse(c, [])

    const session = await repos.workSession.findActiveSession(record.id)
    if (!session) return successResponse(c, [])

    const report = await repos.dailyReport.findReportByUserAndDate(userId, date)
    if (!report) return successResponse(c, [])

    const tasks = await repos.dailyReport.findTasksBySession(
      report.id,
      session.id,
      TASK_TYPE_PLANNED,
    )
    return successResponse(
      c,
      tasks.map((t) => ({ taskName: t.taskName, hours: t.hours })),
    )
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// 過去セッションの実績タスク取得（退勤ダイアログの読み取り専用表示用）
const todayPreviousActualsRoute = createRoute({
  method: "get",
  path: "/today/previous-actuals",
  tags: ["勤怠"],
  summary: "過去セッションの実績タスク取得",
  description: "本日の過去セッションで入力した実績タスクを取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(z.array(taskSchema)) } },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

queriesRouter.openapi(todayPreviousActualsRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) return successResponse(c, [])

    const report = await repos.dailyReport.findReportByUserAndDate(userId, date)
    if (!report) return successResponse(c, [])

    const session = await repos.workSession.findActiveSession(record.id)

    let tasks: { taskName: string; hours: number | null }[]
    if (session) {
      // アクティブセッションあり（退勤ダイアログ用）: 現在セッション以外の実績
      tasks = await repos.dailyReport.findPreviousSessionActualTasks(report.id, session.id)
    } else {
      // アクティブセッションなし（出勤ダイアログ用）: 全実績タスク
      tasks = await repos.dailyReport.findAllTasksByReportAndType(report.id, TASK_TYPE_ACTUAL)
    }

    const merged = mergeTasksByName(tasks)
    return successResponse(c, merged)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// 前回退勤時のサマリー・所感を取得（退勤ダイアログの引き継ぎ表示用）
const todayReportSummaryRoute = createRoute({
  method: "get",
  path: "/today/report-summary",
  tags: ["勤怠"],
  summary: "前回退勤時のサマリー取得",
  description: "本日の前回退勤時に入力したサマリー・所感を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(
            z
              .object({
                summary: z.string().nullable(),
                issues: z.string().nullable(),
                notes: z.string().nullable(),
              })
              .nullable(),
          ),
        },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

queriesRouter.openapi(todayReportSummaryRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const result = await repos.dailyReport.findReportSummary(userId, date)
    return successResponse(c, result)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default queriesRouter
