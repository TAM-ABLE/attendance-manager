import { createRoute } from "@hono/zod-openapi"
import { todayJSTString } from "@/lib/time"
import { databaseError, successResponse, validationError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  clockInRequestSchema,
  clockOutRequestSchema,
  clockResponseSchema,
  errorResponseSchema,
  successResponseSchema,
  type Task,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import { getSlackConfig, sendClockInNotification, sendClockOutNotification } from "../../lib/slack"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const clockRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

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
      content: {
        "application/json": {
          schema: successResponseSchema(clockResponseSchema),
        },
      },
      description: "出勤成功",
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
      const dailyReport = await repos.dailyReport.createReport(userId, date)

      if (plannedTasks.length > 0) {
        try {
          await repos.dailyReport.insertTasks(
            dailyReport.id,
            plannedTasks.map((task: Task, index: number) => ({
              taskType: "planned",
              taskName: task.taskName,
              hours: task.hours,
              sortOrder: index,
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
    const slackResult = await sendClockInNotification(slackConfig, userName, plannedTasks)

    if (slackResult.ts) {
      try {
        await repos.workSession.updateSlackTs(session.id, slackResult.ts)
      } catch (e) {
        console.error("Failed to save slack_clock_in_ts:", e)
      }
    }

    return successResponse(c, { slack_ts: slackResult.ts })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
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
      content: {
        "application/json": {
          schema: successResponseSchema(clockResponseSchema),
        },
      },
      description: "退勤成功",
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

    const session = await repos.workSession.findActiveSessionWithSlackTs(record.id)
    if (!session) {
      return validationError(c, "No active session to clock out")
    }

    await repos.workSession.updateClockOut(session.id, clockOutTime ?? new Date().toISOString())

    try {
      const dailyReport = await repos.dailyReport.findUnsubmittedReport(userId, date)

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
              actualTasks.map((task: Task, index: number) => ({
                taskType: "actual",
                taskName: task.taskName,
                hours: task.hours,
                sortOrder: index,
              })),
            )
          } catch (e) {
            console.error("Failed to insert actual tasks:", e)
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch daily report:", e)
    }

    const slackConfig = getSlackConfig(c.env)
    const slackResult = await sendClockOutNotification(slackConfig, userName, actualTasks, {
      summary,
      issues,
      notes,
      threadTs: session.slack_clock_in_ts ?? undefined,
    })

    return successResponse(c, { slack_ts: slackResult.ts })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default clockRouter
