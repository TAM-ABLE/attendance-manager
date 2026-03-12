import { createRoute } from "@hono/zod-openapi"
import { TASK_TYPE_ACTUAL, TASK_TYPE_PLANNED } from "@/lib/constants"
import { todayJSTString } from "@/lib/time"
import type { Task } from "@/types/Attendance"
import { databaseError, handleRouteError, successResponse, validationError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  clockInRequestSchema,
  clockOutRequestSchema,
  clockResponseSchema,
  type Task as SchemaTask,
  successResponseSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import {
  getSlackConfig,
  type SlackConfig,
  sendClockInNotification,
  sendClockOutNotification,
  updateSlackMessage,
} from "../../lib/slack"
import { mergeTasksByName } from "../../lib/task-merge"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

type Repos = ReturnType<typeof createRepos>

const clockRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// ===== Slack通知ヘルパー（fire-and-forget） =====

function fireClockInSlack(
  slackConfig: SlackConfig,
  repos: Repos,
  userId: string,
  date: string,
  attendanceId: string,
  userName: string,
  plannedTasks: Task[],
): void {
  ;(async () => {
    const { slackClockInTs: existingTs } = await repos.attendance.getSlackTs(attendanceId)

    if (existingTs) {
      // 2回目以降: 累積予定タスクでメッセージを編集
      const report = await repos.dailyReport.findReportByUserAndDate(userId, date)
      if (report) {
        const allPlannedTasks = await repos.dailyReport.findAllTasksByReportAndType(
          report.id,
          TASK_TYPE_PLANNED,
        )
        const mergedTasks = mergeTasksByName(allPlannedTasks)
        await updateSlackMessage(slackConfig, existingTs, userName, mergedTasks, "clock-in")
      }
    } else {
      // 1回目: 新規メッセージ投稿
      const slackResult = await sendClockInNotification(slackConfig, userName, plannedTasks)
      if (slackResult.ts) {
        await repos.attendance.updateSlackClockInTs(attendanceId, slackResult.ts)
      }
    }
  })().catch((e) => {
    console.error("Slack clock-in notification error:", e)
  })
}

function fireClockOutSlack(
  slackConfig: SlackConfig,
  repos: Repos,
  dailyReportId: string,
  recordId: string,
  userName: string,
  reportFields: { summary?: string; issues?: string; notes?: string },
): void {
  ;(async () => {
    const { slackClockInTs, slackClockOutTs } = await repos.attendance.getSlackTs(recordId)

    // 累積実績タスクを取得（同名合算）
    const allActualTasks = await repos.dailyReport.findAllTasksByReportAndType(
      dailyReportId,
      TASK_TYPE_ACTUAL,
    )
    const mergedTasks = mergeTasksByName(allActualTasks)

    if (slackClockOutTs) {
      // 2回目以降: 既存の退勤メッセージを編集
      await updateSlackMessage(
        slackConfig,
        slackClockOutTs,
        userName,
        mergedTasks,
        "clock-out",
        reportFields,
      )
    } else {
      // 1回目: スレッド返信で新規投稿
      const slackResult = await sendClockOutNotification(slackConfig, userName, mergedTasks, {
        ...reportFields,
        threadTs: slackClockInTs ?? undefined,
      })
      if (slackResult.ts) {
        await repos.attendance.updateSlackClockOutTs(recordId, slackResult.ts)
      }
    }
  })().catch((e) => {
    console.error("Slack clock-out notification error:", e)
  })
}

// ===== Routes =====

const clockInRoute = createRoute({
  method: "post",
  path: "/clock-in",
  tags: ["勤怠"],
  summary: "出勤",
  description: "出勤を記録し、Slack通知を送信します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: clockInRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(clockResponseSchema) } },
      description: "出勤成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

clockRouter.openapi(clockInRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { userName, plannedTasks, clockInTime } = c.req.valid("json")
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const { id: attendanceId } = await repos.attendance.findOrCreateRecord(userId, date)

    const session = await repos.workSession.createSession(
      attendanceId,
      clockInTime ?? new Date().toISOString(),
    )

    try {
      const dailyReport = await repos.dailyReport.findOrCreateReport(userId, date)

      if (plannedTasks.length > 0) {
        try {
          await repos.dailyReport.insertTasks(
            dailyReport.id,
            plannedTasks.map((task: SchemaTask, index: number) => ({
              taskType: TASK_TYPE_PLANNED,
              taskName: task.taskName,
              hours: task.hours,
              sortOrder: index,
              workSessionId: session.id,
            })),
          )
        } catch (e) {
          console.error("Failed to insert planned tasks:", e)
        }
      }
    } catch (e) {
      if (e instanceof DatabaseError) return databaseError(c, e.message)
      throw e
    }

    const slackConfig = getSlackConfig(c.env)
    if (slackConfig) {
      fireClockInSlack(slackConfig, repos, userId, date, attendanceId, userName, plannedTasks)
    }

    return successResponse(c, {})
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const clockOutRoute = createRoute({
  method: "post",
  path: "/clock-out",
  tags: ["勤怠"],
  summary: "退勤",
  description: "退勤を記録し、日報を提出し、Slack通知を送信します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: clockOutRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(clockResponseSchema) } },
      description: "退勤成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

clockRouter.openapi(clockOutRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { userName, actualTasks, summary, issues, notes, clockOutTime } = c.req.valid("json")
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) {
      return validationError(c, "No attendance record for today")
    }

    const session = await repos.workSession.findActiveSession(record.id)
    if (!session) {
      return validationError(c, "No active session to clock out")
    }

    await repos.workSession.updateClockOut(session.id, clockOutTime ?? new Date().toISOString())

    try {
      const dailyReport = await repos.dailyReport.findReportByUserAndDate(userId, date)

      if (dailyReport) {
        try {
          await repos.dailyReport.updateReport(dailyReport.id, {
            summary: summary || null,
            issues: issues || null,
            notes: notes || null,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error("Failed to update daily report:", e)
        }

        if (actualTasks.length > 0) {
          try {
            await repos.dailyReport.insertTasks(
              dailyReport.id,
              actualTasks.map((task: SchemaTask, index: number) => ({
                taskType: TASK_TYPE_ACTUAL,
                taskName: task.taskName,
                hours: task.hours,
                sortOrder: index,
                workSessionId: session.id,
              })),
            )
          } catch (e) {
            console.error("Failed to insert actual tasks:", e)
          }
        }

        const slackConfig = getSlackConfig(c.env)
        if (slackConfig) {
          fireClockOutSlack(slackConfig, repos, dailyReport.id, record.id, userName, {
            summary,
            issues,
            notes,
          })
        }
      }
    } catch (e) {
      console.error("Failed to fetch daily report:", e)
    }

    return successResponse(c, {})
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default clockRouter
