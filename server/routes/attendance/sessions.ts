import { createRoute, z } from "@hono/zod-openapi"
import { databaseError, successResponse, validationError } from "../../lib/errors"
import { formatWorkSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  dateSchema,
  errorResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  workSessionSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const sessionsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const nullResponseSchema = z.null().openapi({ description: "null" })

const getDateSessionsRoute = createRoute({
  method: "get",
  path: "/{date}/sessions",
  tags: ["勤怠"],
  summary: "自分の特定日のセッション取得",
  description: "認証ユーザー自身の特定日のセッション一覧を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      date: dateSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(z.array(workSessionSchema)),
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

sessionsRouter.openapi(getDateSessionsRoute, async (c) => {
  const { date } = c.req.valid("param")
  const userId = c.get("jwtPayload").sub
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)

    if (!data?.work_sessions || !Array.isArray(data.work_sessions)) {
      return successResponse(c, [])
    }

    return successResponse(c, formatWorkSessions(data.work_sessions))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

const updateDateSessionsRoute = createRoute({
  method: "put",
  path: "/{date}/sessions",
  tags: ["勤怠"],
  summary: "自分の特定日のセッション更新",
  description: "認証ユーザー自身の特定日のセッションを一括更新します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      date: dateSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: updateSessionsRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(nullResponseSchema),
        },
      },
      description: "更新成功",
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

sessionsRouter.openapi(updateDateSessionsRoute, async (c) => {
  const { date } = c.req.valid("param")
  const userId = c.get("jwtPayload").sub
  const { sessions } = c.req.valid("json")
  const repos = createRepos(c.env)

  try {
    const result = await replaceSessions(repos, userId, date, sessions)
    if (result.error) {
      return validationError(c, result.error)
    }
    return successResponse(c, null)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default sessionsRouter
