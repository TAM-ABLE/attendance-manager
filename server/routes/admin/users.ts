import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonthWithRange } from "@/lib/time"
import {
  adminUpdateUser,
  GoTrueError,
  generateLink,
  goTrueAdminListUsers,
} from "../../lib/auth-helpers"
import {
  databaseError,
  handleRouteError,
  internalError,
  notFoundError,
  successResponse,
  validationError,
} from "../../lib/errors"
import { formatAttendanceRecord, getFormattedSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "../../lib/openapi-responses"
import {
  adminCreateUserRequestSchema,
  adminCreateUserResponseSchema,
  adminEmailActionResponseSchema,
  adminUpdateUserRequestSchema,
  adminUpdateUserResponseSchema,
  attendanceRecordSchema,
  dateSchema,
  nullResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  userListResponseSchema,
  uuidSchema,
  workSessionSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import {
  buildInviteEmailHtml,
  buildRecoveryEmailHtml,
  ResendError,
  sendEmail,
} from "../../lib/resend"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const usersRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const getUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["管理者"],
  summary: "ユーザー一覧取得",
  description: "全ユーザーの一覧を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: successResponseSchema(userListResponseSchema) } },
      description: "取得成功",
    },
    500: serverErrorResponse,
  },
})

usersRouter.openapi(getUsersRoute, async (c) => {
  const { profile } = createRepos(c.env)

  try {
    const [data, goTrueUsers] = await Promise.all([
      profile.findAllUsers(),
      goTrueAdminListUsers(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY),
    ])

    const goTrueMap = new Map(goTrueUsers.map((u) => [u.id, u]))

    const users = data.map((u) => {
      const goTrueUser = goTrueMap.get(u.id)
      const passwordChanged = goTrueUser?.user_metadata?.password_changed === true
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        employeeNumber: u.employeeNumber,
        role: u.role as "admin" | "user",
        passwordChanged,
      }
    })

    return successResponse(c, users)
  } catch (e) {
    return handleRouteError(c, e)
  }
})

// ===== POST /admin/users - 管理者によるユーザー作成 =====

function generateNextEmployeeNumber(maxNumber: string | null): string {
  if (!maxNumber) return "A-0001"
  const num = Number.parseInt(maxNumber.replace("A-", ""), 10)
  return `A-${String(num + 1).padStart(4, "0")}`
}

const createUserRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["管理者"],
  summary: "ユーザー作成",
  description: "管理者が新規ユーザーを登録します。roleは自動的にuserとなります。",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: adminCreateUserRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(adminCreateUserResponseSchema) },
      },
      description: "作成成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

usersRouter.openapi(createUserRoute, async (c) => {
  const { lastName, firstName, email } = c.req.valid("json")
  const name = `${lastName} ${firstName}`
  const { profile } = createRepos(c.env)

  const resendApiKey = c.env.RESEND_API_KEY
  const resendFromEmail = c.env.RESEND_FROM_EMAIL
  const appUrl = c.env.APP_URL

  if (!resendApiKey || !resendFromEmail || !appUrl) {
    return internalError(
      c,
      "メール送信の環境変数が未設定です (RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL)",
    )
  }

  try {
    const maxNumber = await profile.findMaxEmployeeNumber()
    const employeeNumber = generateNextEmployeeNumber(maxNumber)

    const result = await generateLink(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      type: "invite",
      email,
      data: {
        name,
        role: "user",
        employee_number: employeeNumber,
        password_changed: false,
      },
      redirect_to: `${appUrl}/set-password`,
    })

    await sendEmail(resendApiKey, {
      from: resendFromEmail,
      to: email,
      subject: "勤怠管理システムへの招待",
      html: buildInviteEmailHtml(result.action_link),
    })

    return successResponse(c, {
      id: result.id,
      name,
      email: result.email ?? email,
      employeeNumber,
      role: "user" as const,
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    if (e instanceof ResendError) return internalError(c, `Email送信エラー: ${e.message}`)
    return internalError(c, e instanceof Error ? e.message : "Unknown error")
  }
})

// ===== PATCH /admin/users/:userId - ユーザー情報更新 =====

const updateUserRoute = createRoute({
  method: "patch",
  path: "/{userId}",
  tags: ["管理者"],
  summary: "ユーザー情報更新",
  description:
    "指定ユーザーの情報を更新します。送信されたフィールドのみ更新されます。GoTrueとDBの両方を更新します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: adminUpdateUserRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(adminUpdateUserResponseSchema) },
      },
      description: "更新成功",
    },
    400: validationErrorResponse,
    404: notFoundResponse("ユーザーが見つからない"),
    500: serverErrorResponse,
  },
})

usersRouter.openapi(updateUserRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const body = c.req.valid("json")
  const { profile } = createRepos(c.env)

  const { lastName, firstName, email } = body

  // 姓名が片方だけ指定された場合、現在の値と結合する
  let name: string | undefined
  if (lastName !== undefined || firstName !== undefined) {
    try {
      const current = await profile.findById(userId)
      const [currentLastName, ...rest] = current.name.split(" ")
      const currentFirstName = rest.join(" ")
      const newLastName = lastName ?? currentLastName
      const newFirstName = firstName ?? currentFirstName
      name = `${newLastName} ${newFirstName}`
    } catch (e) {
      if (e instanceof DatabaseError) return notFoundError(c, "User")
      throw e
    }
  }

  // メール重複チェック（GoTrue呼び出し前にDB側で事前検証）
  if (email !== undefined) {
    try {
      const existing = await profile.findByEmail(email, userId)
      if (existing) {
        return validationError(c, "このメールアドレスは既に使用されています")
      }
    } catch (e) {
      if (e instanceof DatabaseError) return databaseError(c, e.message)
      throw e
    }
  }

  try {
    // 1. GoTrue 側を更新 (email, user_metadata.name)
    const goTrueParams: {
      email?: string
      user_metadata?: Record<string, unknown>
    } = {}
    if (email !== undefined) goTrueParams.email = email
    if (name !== undefined) goTrueParams.user_metadata = { name }

    if (Object.keys(goTrueParams).length > 0) {
      await adminUpdateUser(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_ROLE_KEY,
        userId,
        goTrueParams,
      )
    }

    // 2. profiles テーブルを更新
    const dbUpdate: { name?: string; email?: string } = {}
    if (name !== undefined) dbUpdate.name = name
    if (email !== undefined) dbUpdate.email = email

    const updated = await profile.updateUser(userId, dbUpdate)

    return successResponse(c, {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      employeeNumber: updated.employeeNumber,
      role: updated.role as "admin" | "user",
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    return internalError(c, e instanceof Error ? e.message : "Unknown error")
  }
})

// ===== POST /admin/users/:userId/resend-invite - 招待メール再送 =====

const resendInviteRoute = createRoute({
  method: "post",
  path: "/{userId}/resend-invite",
  tags: ["管理者"],
  summary: "招待メール再送",
  description: "指定ユーザーに招待メールを再送します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(adminEmailActionResponseSchema),
        },
      },
      description: "再送成功",
    },
    404: notFoundResponse("ユーザーが見つからない"),
    500: serverErrorResponse,
  },
})

usersRouter.openapi(resendInviteRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const { profile } = createRepos(c.env)

  const resendApiKey = c.env.RESEND_API_KEY
  const resendFromEmail = c.env.RESEND_FROM_EMAIL
  const appUrl = c.env.APP_URL

  if (!resendApiKey || !resendFromEmail || !appUrl) {
    return internalError(
      c,
      "メール送信の環境変数が未設定です (RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL)",
    )
  }

  try {
    const user = await profile.findById(userId)

    const result = await generateLink(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      type: "invite",
      email: user.email,
      data: {
        name: user.name,
        role: user.role,
        employee_number: user.employeeNumber,
        password_changed: false,
      },
      redirect_to: `${appUrl}/set-password`,
    })

    await sendEmail(resendApiKey, {
      from: resendFromEmail,
      to: user.email,
      subject: "勤怠管理システムへの招待",
      html: buildInviteEmailHtml(result.action_link),
    })

    return successResponse(c, { message: "招待メールを再送しました" })
  } catch (e) {
    if (e instanceof DatabaseError) return notFoundError(c, "User")
    if (e instanceof GoTrueError) return internalError(c, e.message)
    if (e instanceof ResendError) return internalError(c, `Email送信エラー: ${e.message}`)
    return internalError(c, e instanceof Error ? e.message : "Unknown error")
  }
})

// ===== POST /admin/users/:userId/password-reset - パスワードリセット =====

const passwordResetRoute = createRoute({
  method: "post",
  path: "/{userId}/password-reset",
  tags: ["管理者"],
  summary: "パスワードリセット",
  description: "指定ユーザーにパスワードリセットメールを送信します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(adminEmailActionResponseSchema),
        },
      },
      description: "送信成功",
    },
    404: notFoundResponse("ユーザーが見つからない"),
    500: serverErrorResponse,
  },
})

usersRouter.openapi(passwordResetRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const { profile } = createRepos(c.env)

  const resendApiKey = c.env.RESEND_API_KEY
  const resendFromEmail = c.env.RESEND_FROM_EMAIL
  const appUrl = c.env.APP_URL

  if (!resendApiKey || !resendFromEmail || !appUrl) {
    return internalError(
      c,
      "メール送信の環境変数が未設定です (RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL)",
    )
  }

  try {
    const user = await profile.findById(userId)

    const result = await generateLink(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      type: "recovery",
      email: user.email,
      redirect_to: `${appUrl}/set-password`,
    })

    await sendEmail(resendApiKey, {
      from: resendFromEmail,
      to: user.email,
      subject: "パスワードリセット - 勤怠管理システム",
      html: buildRecoveryEmailHtml(result.action_link),
    })

    return successResponse(c, { message: "パスワードリセットメールを送信しました" })
  } catch (e) {
    if (e instanceof DatabaseError) return notFoundError(c, "User")
    if (e instanceof GoTrueError) return internalError(c, e.message)
    if (e instanceof ResendError) return internalError(c, `Email送信エラー: ${e.message}`)
    return internalError(c, e instanceof Error ? e.message : "Unknown error")
  }
})

const getUserMonthlyRoute = createRoute({
  method: "get",
  path: "/{userId}/attendance/month/{yearMonth}",
  tags: ["管理者"],
  summary: "ユーザーの月別勤怠取得",
  description: "指定ユーザーの月別勤怠記録を取得します。",
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
        "application/json": { schema: successResponseSchema(z.array(attendanceRecordSchema)) },
      },
      description: "取得成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

usersRouter.openapi(getUserMonthlyRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonthWithRange(yearMonth)
  if (!parsed) return validationError(c, "Invalid year-month format")
  const { start, end } = parsed

  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordsByDateRange(userId, start, end)
    c.header("Cache-Control", "private, max-age=60")
    return successResponse(c, data.map(formatAttendanceRecord))
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const getUserSessionsRoute = createRoute({
  method: "get",
  path: "/{userId}/attendance/{date}/sessions",
  tags: ["管理者"],
  summary: "ユーザーの特定日のセッション取得",
  description: "指定ユーザーの特定日のセッション一覧を取得します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
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

usersRouter.openapi(getUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)
    return successResponse(c, getFormattedSessions(data))
  } catch (e) {
    return handleRouteError(c, e)
  }
})

const updateUserSessionsRoute = createRoute({
  method: "put",
  path: "/{userId}/attendance/{date}/sessions",
  tags: ["管理者"],
  summary: "ユーザーの特定日のセッション更新",
  description: "指定ユーザーの特定日のセッションを一括更新します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
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

usersRouter.openapi(updateUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
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

export default usersRouter
