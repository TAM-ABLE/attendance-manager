import { createRoute } from "@hono/zod-openapi"
import { todayJSTString } from "@/lib/time"
import { databaseError, handleRouteError, successResponse, validationError } from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  clockInRequestSchema,
  clockOutRequestSchema,
  clockResponseSchema,
  successResponseSchema,
  type Task,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import {
  getSlackConfig,
  sendClockInNotification,
  sendClockOutNotification,
  updateSlackMessage,
} from "../../lib/slack"
import { mergeTasksByName } from "../../lib/task-merge"
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
            plannedTasks.map((task: Task, index: number) => ({
              taskType: "planned",
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

    // Slack通知
    const slackConfig = getSlackConfig(c.env)
    if (slackConfig) {
      const { slackClockInTs: existingTs } = await repos.attendance.getSlackTs(attendanceId)

      if (existingTs) {
        // 2回目以降: 累積予定タスクでメッセージを編集
        const report = await repos.dailyReport.findReportByUserAndDate(userId, date)
        if (report) {
          const allPlannedTasks = await repos.dailyReport.findAllTasksByReportAndType(
            report.id,
            "planned",
          )
          const mergedTasks = mergeTasksByName(allPlannedTasks)
          updateSlackMessage(slackConfig, existingTs, userName, mergedTasks, "clock-in").catch(
            (e) => {
              console.error("Failed to update clock-in Slack message:", e)
            },
          )
        }
      } else {
        // 1回目: 新規メッセージ投稿
        sendClockInNotification(slackConfig, userName, plannedTasks)
          .then((slackResult) => {
            if (slackResult.ts) {
              repos.attendance.updateSlackClockInTs(attendanceId, slackResult.ts).catch((e) => {
                console.error("Failed to save slack_clock_in_ts:", e)
              })
            }
          })
          .catch((e) => {
            console.error("Failed to send clock-in Slack notification:", e)
          })
      }
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
              actualTasks.map((task: Task, index: number) => ({
                taskType: "actual",
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

        // Slack通知
        const slackConfig = getSlackConfig(c.env)
        if (slackConfig) {
          const { slackClockInTs, slackClockOutTs } = await repos.attendance.getSlackTs(record.id)

          // 累積実績タスクを取得（同名合算）
          const allActualTasks = await repos.dailyReport.findAllTasksByReportAndType(
            dailyReport.id,
            "actual",
          )
          const mergedTasks = mergeTasksByName(allActualTasks)

          if (slackClockOutTs) {
            // 2回目以降: 既存の退勤メッセージを編集
            updateSlackMessage(slackConfig, slackClockOutTs, userName, mergedTasks, "clock-out", {
              summary,
              issues,
              notes,
            }).catch((e) => {
              console.error("Failed to update clock-out Slack message:", e)
            })
          } else {
            // 1回目: スレッド返信で新規投稿
            sendClockOutNotification(slackConfig, userName, mergedTasks, {
              summary,
              issues,
              notes,
              threadTs: slackClockInTs ?? undefined,
            })
              .then((slackResult) => {
                if (slackResult.ts) {
                  repos.attendance.updateSlackClockOutTs(record.id, slackResult.ts).catch((e) => {
                    console.error("Failed to save slack_clock_out_ts:", e)
                  })
                }
              })
              .catch((e) => {
                console.error("Failed to send clock-out Slack notification:", e)
              })
          }
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
