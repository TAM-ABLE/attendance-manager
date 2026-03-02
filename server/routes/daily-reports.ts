import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonthWithRange } from "@/lib/time"
import type {
  DailyReport,
  DailyReportListItem,
  DailyReportTask,
  UserForSelect,
} from "@/types/DailyReport"
import { handleRouteError, notFoundError, successResponse, validationError } from "../lib/errors"
import { createOpenAPIHono } from "../lib/openapi-hono"
import {
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "../lib/openapi-responses"
import {
  dailyReportDetailResponseSchema,
  dailyReportListItemSchema,
  dailyReportListResponseSchema,
  successResponseSchema,
  usersForSelectResponseSchema,
  uuidSchema,
  yearMonthSchema,
} from "../lib/openapi-schemas"
import { createRepos } from "../lib/repositories"
import type { AuthVariables } from "../middleware/auth"
import type { Env } from "../types/env"

const dailyReportsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// ===== 指定日の日報取得 =====

const getReportsByDateRoute = createRoute({
  method: "get",
  path: "/by-date",
  tags: ["日報"],
  summary: "指定日の提出済み日報一覧取得",
  description: "指定日に提出された全ユーザーの日報一覧を取得します（管理者用）。日付を指定しない場合は本日の日報を返します。",
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .openapi({ description: "対象日（YYYY-MM-DD形式）。省略時は本日。" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(z.array(dailyReportListItemSchema)),
        },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getReportsByDateRoute, async (c) => {
  const { dailyReport: dailyReportRepo } = createRepos(c.env)
  const { date } = c.req.valid("query")

  try {
    // 日付が指定されていない場合は本日（日本時間）
    let targetDate = date
    if (!targetDate) {
      const now = new Date()
      const jstOffset = 9 * 60 * 60 * 1000
      const jstDate = new Date(now.getTime() + jstOffset)
      targetDate = jstDate.toISOString().split("T")[0]
    }

    const reports = await dailyReportRepo.findSubmittedReportsByDate(targetDate)

    const reportList: DailyReportListItem[] = reports.map((report) => {
      const tasks = report.tasks || []
      const plannedCount = tasks.filter((t) => t.taskType === "planned").length
      const actualCount = tasks.filter((t) => t.taskType === "actual").length

      return {
        id: report.id,
        userId: report.userId,
        userName: report.profile.name,
        employeeNumber: report.profile.employeeNumber,
        date: report.date,
        submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
        plannedTaskCount: plannedCount,
        actualTaskCount: actualCount,
        hasIssues: report.issues != null && report.issues.trim() !== "",
      }
    })

    return successResponse(c, reportList)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// ===== 本日の日報取得（後方互換性のため残す） =====

const getTodayReportsRoute = createRoute({
  method: "get",
  path: "/today",
  tags: ["日報"],
  summary: "本日の提出済み日報一覧取得",
  description: "本日提出された全ユーザーの日報一覧を取得します（管理者用）。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(z.array(dailyReportListItemSchema)),
        },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getTodayReportsRoute, async (c) => {
  const { dailyReport: dailyReportRepo } = createRepos(c.env)

  try {
    // 本日の日付を取得（日本時間）
    const now = new Date()
    const jstOffset = 9 * 60 * 60 * 1000
    const jstDate = new Date(now.getTime() + jstOffset)
    const today = jstDate.toISOString().split("T")[0]

    const reports = await dailyReportRepo.findSubmittedReportsByDate(today)

    const reportList: DailyReportListItem[] = reports.map((report) => {
      const tasks = report.tasks || []
      const plannedCount = tasks.filter((t) => t.taskType === "planned").length
      const actualCount = tasks.filter((t) => t.taskType === "actual").length

      return {
        id: report.id,
        userId: report.userId,
        userName: report.profile.name,
        employeeNumber: report.profile.employeeNumber,
        date: report.date,
        submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
        plannedTaskCount: plannedCount,
        actualTaskCount: actualCount,
        hasIssues: report.issues != null && report.issues.trim() !== "",
      }
    })

    return successResponse(c, reportList)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// ===== ユーザー一覧取得 =====

const getUsersRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["日報"],
  summary: "ユーザー一覧取得（日報用）",
  description: "日報閲覧用のユーザー一覧を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(usersForSelectResponseSchema) },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getUsersRoute, async (c) => {
  const { profile } = createRepos(c.env)

  try {
    const data = await profile.findAllUsersForSelect()

    const users: UserForSelect[] = data.map((user) => ({
      id: user.id,
      name: user.name,
      employeeNumber: user.employeeNumber,
    }))

    return successResponse(c, users)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const getUserMonthlyReportsRoute = createRoute({
  method: "get",
  path: "/user/{userId}/month/{yearMonth}",
  tags: ["日報"],
  summary: "ユーザーの月別日報一覧取得",
  description: "指定ユーザーの月別日報一覧を取得します。",
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
        "application/json": { schema: successResponseSchema(dailyReportListResponseSchema) },
      },
      description: "取得成功",
    },
    400: validationErrorResponse,
    404: notFoundResponse("ユーザーが見つかりません"),
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getUserMonthlyReportsRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonthWithRange(yearMonth)
  if (!parsed) return validationError(c, "Invalid year-month format")
  const { start: monthStart, end: monthEnd } = parsed

  const repos = createRepos(c.env)

  try {
    let userData: { id: string; name: string; employeeNumber: string }
    try {
      userData = await repos.profile.findById(userId)
    } catch {
      return notFoundError(c, "User")
    }

    const reports = await repos.dailyReport.findReportsByDateRange(userId, monthStart, monthEnd)

    const reportList: DailyReportListItem[] = (reports || []).map((report) => {
      const tasks = report.tasks || []
      const plannedCount = tasks.filter((t) => t.taskType === "planned").length
      const actualCount = tasks.filter((t) => t.taskType === "actual").length

      return {
        id: report.id,
        userId: report.userId,
        userName: userData.name,
        employeeNumber: userData.employeeNumber,
        date: report.date,
        submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
        plannedTaskCount: plannedCount,
        actualTaskCount: actualCount,
        hasIssues: report.issues != null && report.issues.trim() !== "",
      }
    })

    c.header("Cache-Control", "private, max-age=60")
    return successResponse(c, {
      user: {
        id: userData.id,
        name: userData.name,
        employeeNumber: userData.employeeNumber,
      },
      yearMonth,
      reports: reportList,
    })
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const getReportDetailRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["日報"],
  summary: "日報詳細取得",
  description: "指定された日報の詳細を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: uuidSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(dailyReportDetailResponseSchema) },
      },
      description: "取得成功",
    },
    404: notFoundResponse("日報が見つかりません"),
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getReportDetailRoute, async (c) => {
  const { id } = c.req.valid("param")
  const { dailyReport: dailyReportRepo } = createRepos(c.env)

  try {
    let report: Awaited<ReturnType<typeof dailyReportRepo.findReportWithTasks>>
    try {
      report = await dailyReportRepo.findReportWithTasks(id)
    } catch {
      return notFoundError(c, "Daily report")
    }

    const tasks = report.tasks || []
    const plannedTasks: DailyReportTask[] = tasks
      .filter((t) => t.taskType === "planned")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({
        id: t.id,
        taskType: t.taskType as "planned",
        taskName: t.taskName,
        hours: t.hours,
        sortOrder: t.sortOrder,
      }))

    const actualTasks: DailyReportTask[] = tasks
      .filter((t) => t.taskType === "actual")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({
        id: t.id,
        taskType: t.taskType as "actual",
        taskName: t.taskName,
        hours: t.hours,
        sortOrder: t.sortOrder,
      }))

    const dailyReport: DailyReport = {
      id: report.id,
      userId: report.userId,
      date: report.date,
      summary: report.summary,
      issues: report.issues,
      notes: report.notes,
      submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
      plannedTasks,
      actualTasks,
      createdAt: new Date(report.createdAt).getTime(),
      updatedAt: new Date(report.updatedAt).getTime(),
    }

    return successResponse(c, dailyReport)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default dailyReportsRouter
