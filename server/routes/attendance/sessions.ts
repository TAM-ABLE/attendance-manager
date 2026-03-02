import { createRoute, z } from "@hono/zod-openapi"
import { handleRouteError, successResponse, validationError } from "../../lib/errors"
import { getFormattedSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import {
  dateSchema,
  nullResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  workSessionSchema,
} from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const sessionsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

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
        "application/json": { schema: successResponseSchema(z.array(workSessionSchema)) },
      },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

sessionsRouter.openapi(getDateSessionsRoute, async (c) => {
  const { date } = c.req.valid("param")
  const userId = c.get("jwtPayload").sub
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)
    return successResponse(c, getFormattedSessions(data))
  } catch (e) {
    return handleRouteError(c, e)
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
      content: { "application/json": { schema: successResponseSchema(nullResponseSchema) } },
      description: "更新成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
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
    return handleRouteError(c, e)
  }
})

export default sessionsRouter
