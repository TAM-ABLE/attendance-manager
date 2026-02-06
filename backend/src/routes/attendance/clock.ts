import { todayJSTString } from "@attendance-manager/shared/lib/time"
// backend/src/routes/attendance/clock.ts
import { createRoute } from "@hono/zod-openapi"
import { databaseError, successResponse, validationError } from "../../../lib/errors"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import {
  clockInRequestSchema,
  clockOutRequestSchema,
  clockResponseSchema,
  errorResponseSchema,
  successResponseSchema,
  type Task,
} from "../../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../../lib/repositories"
import {
  getSlackConfig,
  sendClockInNotification,
  sendClockOutNotification,
} from "../../../lib/slack"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const clockRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// POST /attendance/clock-in
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
    // 1. attendance_record を取得または作成
    const { id: attendanceId } = await repos.attendance.findOrCreateRecord(userId, date)

    // 2. work_session を作成
    const session = await repos.workSession.createSession(
      attendanceId,
      clockInTime ?? new Date().toISOString(),
    )

    // 3. 日報を作成し、予定タスクを保存
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
          // タスク保存失敗は警告として記録するが、出勤処理は成功扱い
          console.error("Failed to insert planned tasks:", e)
        }
      }
    } catch (e) {
      // 日報作成失敗は致命的エラー
      if (e instanceof DatabaseError) return databaseError(c, e.message)
      throw e
    }

    // 4. Slack に通知を送信
    const slackConfig = getSlackConfig(c.env)
    const slackResult = await sendClockInNotification(slackConfig, userName, plannedTasks)

    // 5. Slackメッセージのtsをwork_sessionに保存（スレッド返信用）
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

// POST /attendance/clock-out
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
    // 1. 今日のattendance_recordを取得
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) {
      return validationError(c, "No attendance record for today")
    }

    // 2. アクティブなセッションを取得（slack_clock_in_tsも取得してスレッド返信に使用）
    const session = await repos.workSession.findActiveSessionWithSlackTs(record.id)
    if (!session) {
      return validationError(c, "No active session to clock out")
    }

    // 3. 退勤時刻を記録
    await repos.workSession.updateClockOut(session.id, clockOutTime ?? new Date().toISOString())

    // 4. 日報を更新し、実績タスクを保存
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
      // 日報取得失敗は警告として記録するが、退勤処理は続行
      console.error("Failed to fetch daily report:", e)
    }

    // 5. Slack に通知を送信（出勤メッセージのスレッドに返信）
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
