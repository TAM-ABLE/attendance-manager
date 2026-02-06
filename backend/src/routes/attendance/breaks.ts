import { todayJSTString } from "@attendance-manager/shared/lib/time"
// backend/src/routes/attendance/breaks.ts
import { createRoute, z } from "@hono/zod-openapi"
import { databaseError, successResponse, validationError } from "../../../lib/errors"
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import {
  breakEndRequestSchema,
  breakStartRequestSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const breaksRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const nullResponseSchema = z.null().openapi({ description: "null" })

// POST /attendance/breaks/start
const breakStartRoute = createRoute({
  method: "post",
  path: "/start",
  tags: ["勤怠"],
  summary: "休憩開始",
  description: "休憩を開始します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: breakStartRequestSchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(nullResponseSchema),
        },
      },
      description: "休憩開始成功",
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

breaksRouter.openapi(breakStartRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const body = c.req.valid("json")
  const breakStartTime = body?.breakStartTime
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    // 1. 今日の attendance_record を取得
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) {
      return validationError(c, "No attendance record for today")
    }

    // 2. clock_out が null の最新 session を取得
    const session = await repos.workSession.findActiveSession(record.id)
    if (!session) {
      return validationError(c, "No active session")
    }

    // 3. この session で「未終了 break」 が無いか確認
    const activeBreak = await repos.break.findActiveBreak(session.id)
    if (activeBreak) {
      return validationError(c, "Break already in progress")
    }

    // 4. break_start レコードを作成
    await repos.break.startBreak(session.id, breakStartTime ?? new Date().toISOString())

    return successResponse(c, null)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

// POST /attendance/breaks/end
const breakEndRoute = createRoute({
  method: "post",
  path: "/end",
  tags: ["勤怠"],
  summary: "休憩終了",
  description: "休憩を終了します。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: breakEndRequestSchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(nullResponseSchema),
        },
      },
      description: "休憩終了成功",
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

breaksRouter.openapi(breakEndRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const body = c.req.valid("json")
  const breakEndTime = body?.breakEndTime
  const date = todayJSTString()
  const repos = createRepos(c.env)

  try {
    // 1. 今日の attendance_record を取得
    const record = await repos.attendance.findRecordIdByUserAndDate(userId, date)
    if (!record) {
      return validationError(c, "No attendance record for today")
    }

    // 2. active session（clock_out が null）の最新 1つ取得
    const session = await repos.workSession.findActiveSession(record.id)
    if (!session) {
      return validationError(c, "No active session")
    }

    // 3. break_end が null の「現在の break」を取得
    const activeBreak = await repos.break.findActiveBreak(session.id)
    if (!activeBreak) {
      return validationError(c, "No active break to end")
    }

    // 4. break_end を埋める
    await repos.break.endBreak(activeBreak.id, breakEndTime ?? new Date().toISOString())

    return successResponse(c, null)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default breaksRouter
