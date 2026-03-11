import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonthWithRange, todayJSTString } from "@/lib/time"
import type {
  DailyReport,
  DailyReportListItem,
  DailyReportTask,
  UserForSelect,
} from "@/types/DailyReport"
import {
  forbiddenError,
  handleRouteError,
  notFoundError,
  successResponse,
  validationError,
} from "../lib/errors"
import { createOpenAPIHono } from "../lib/openapi-hono"
import {
  forbiddenResponse,
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
import { mergeTasks } from "../lib/task-merge"
import type { AuthVariables } from "../middleware/auth"
import type { Env } from "../types/env"

const dailyReportsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

function toReportListItem(
  report: {
    id: string
    userId: string
    date: string
    issues: string | null
    submittedAt: string | null
    tasks: { taskType: string }[]
  },
  user: { name: string; employeeNumber: string },
): DailyReportListItem {
  const tasks = report.tasks || []
  return {
    id: report.id,
    userId: report.userId,
    userName: user.name,
    employeeNumber: user.employeeNumber,
    date: report.date,
    submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
    plannedTaskCount: tasks.filter((t) => t.taskType === "planned").length,
    actualTaskCount: tasks.filter((t) => t.taskType === "actual").length,
    hasIssues: report.issues != null && report.issues.trim() !== "",
  }
}

// ===== 指定日の日報取得 =====

const getReportsByDateRoute = createRoute({
  method: "get",
  path: "/by-date",
  tags: ["日報"],
  summary: "指定日の提出済み日報一覧取得（管理者用）",
  description:
    "指定日に提出された全ユーザーの日報一覧を取得します（管理者用）。日付を指定しない場合は本日の日報を返します。",
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
    403: forbiddenResponse("管理者権限が必要です"),
    500: serverErrorResponse,
  },
})

dailyReportsRouter.openapi(getReportsByDateRoute, async (c) => {
  const payload = c.get("jwtPayload")
  if (payload.role !== "admin") {
    return forbiddenError(c, "Admin access required")
  }

  const { dailyReport: dailyReportRepo } = createRepos(c.env)
  const { date } = c.req.valid("query")

  try {
    const targetDate = date ?? todayJSTString()

    const reports = await dailyReportRepo.findSubmittedReportsByDate(targetDate)
    const reportList = reports.map((report) => toReportListItem(report, report.profile))

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
    const reportList = (reports || []).map((report) => toReportListItem(report, userData))

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

    const rawPlanned = tasks
      .filter((t) => t.taskType === "planned")
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const rawActual = tasks
      .filter((t) => t.taskType === "actual")
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const plannedTasks: DailyReportTask[] = mergeTasks(rawPlanned, "planned")
    const actualTasks: DailyReportTask[] = mergeTasks(rawActual, "actual")

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
