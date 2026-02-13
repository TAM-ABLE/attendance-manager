import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonth } from "@/lib/time"
import type {
  DailyReport,
  DailyReportListItem,
  DailyReportTask,
  UserForSelect,
} from "@/types/DailyReport"
import { databaseError, notFoundError, successResponse, validationError } from "../lib/errors"
import { createOpenAPIHono } from "../lib/openapi-hono"
import {
  dailyReportDetailResponseSchema,
  dailyReportListResponseSchema,
  errorResponseSchema,
  successResponseSchema,
  usersForSelectResponseSchema,
  uuidSchema,
  yearMonthSchema,
} from "../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../lib/repositories"
import type { AuthVariables } from "../middleware/auth"
import type { Env } from "../types/env"

const dailyReportsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

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
        "application/json": {
          schema: successResponseSchema(usersForSelectResponseSchema),
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

dailyReportsRouter.openapi(getUsersRoute, async (c) => {
  const { profile } = createRepos(c.env)

  try {
    const data = await profile.findAllUsersForSelect()

    const users: UserForSelect[] = data.map((user) => ({
      id: user.id,
      name: user.name,
      employeeNumber: user.employee_number,
    }))

    return successResponse(c, users)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
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
        "application/json": {
          schema: successResponseSchema(dailyReportListResponseSchema),
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
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "ユーザーが見つかりません",
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

dailyReportsRouter.openapi(getUserMonthlyReportsRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonth(yearMonth)
  if (!parsed) {
    return validationError(c, "Invalid year-month format")
  }
  const { year, month } = parsed

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const repos = createRepos(c.env)

  try {
    let userData: { id: string; name: string; employee_number: string }
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
        employeeNumber: userData.employee_number,
        date: report.date,
        submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
        plannedTaskCount: plannedCount,
        actualTaskCount: actualCount,
      }
    })

    return successResponse(c, {
      user: {
        id: userData.id,
        name: userData.name,
        employeeNumber: userData.employee_number,
      },
      yearMonth,
      reports: reportList,
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
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
        "application/json": {
          schema: successResponseSchema(dailyReportDetailResponseSchema),
        },
      },
      description: "取得成功",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "日報が見つかりません",
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
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default dailyReportsRouter
