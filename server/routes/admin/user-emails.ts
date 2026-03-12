import { createRoute, z } from "@hono/zod-openapi"
import {
  EMPLOYEE_NUMBER_DEFAULT,
  EMPLOYEE_NUMBER_PAD,
  EMPLOYEE_NUMBER_PREFIX,
} from "@/lib/constants"
import { generateLink } from "../../lib/auth-helpers"
import {
  databaseError,
  handleAdminRouteError,
  internalError,
  successResponse,
} from "../../lib/errors"
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
  successResponseSchema,
  uuidSchema,
} from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import { DatabaseError } from "../../lib/repositories/errors"
import {
  buildInviteEmailHtml,
  buildRecoveryEmailHtml,
  ResendError,
  sendEmail,
} from "../../lib/resend"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const userEmailsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

/**
 * メール送信に必要な環境変数を検証して返す
 * 未設定の場合は null を返す
 */
function getEmailEnv(env: Env) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL } = env
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !APP_URL) return null
  return { resendApiKey: RESEND_API_KEY, resendFromEmail: RESEND_FROM_EMAIL, appUrl: APP_URL }
}

// ===== POST /admin/users - 管理者によるユーザー作成 =====

function generateNextEmployeeNumber(maxNumber: string | null): string {
  if (!maxNumber || !maxNumber.startsWith(EMPLOYEE_NUMBER_PREFIX)) {
    return EMPLOYEE_NUMBER_DEFAULT
  }
  const num = Number.parseInt(maxNumber.slice(EMPLOYEE_NUMBER_PREFIX.length), 10)
  if (Number.isNaN(num)) return EMPLOYEE_NUMBER_DEFAULT
  return `${EMPLOYEE_NUMBER_PREFIX}${String(num + 1).padStart(EMPLOYEE_NUMBER_PAD, "0")}`
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

userEmailsRouter.openapi(createUserRoute, async (c) => {
  const { lastName, firstName, email } = c.req.valid("json")
  const name = `${lastName} ${firstName}`
  const { profile } = createRepos(c.env)

  const emailEnv = getEmailEnv(c.env)
  if (!emailEnv) {
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
      redirect_to: `${emailEnv.appUrl}/set-password`,
    })

    await sendEmail(emailEnv.resendApiKey, {
      from: emailEnv.resendFromEmail,
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

userEmailsRouter.openapi(resendInviteRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const { profile } = createRepos(c.env)

  const emailEnv = getEmailEnv(c.env)
  if (!emailEnv) {
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
      redirect_to: `${emailEnv.appUrl}/set-password`,
    })

    await sendEmail(emailEnv.resendApiKey, {
      from: emailEnv.resendFromEmail,
      to: user.email,
      subject: "勤怠管理システムへの招待",
      html: buildInviteEmailHtml(result.action_link),
    })

    return successResponse(c, { message: "招待メールを再送しました" })
  } catch (e) {
    return handleAdminRouteError(c, e, { dbErrorAsNotFound: "User" })
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

userEmailsRouter.openapi(passwordResetRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const { profile } = createRepos(c.env)

  const emailEnv = getEmailEnv(c.env)
  if (!emailEnv) {
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
      redirect_to: `${emailEnv.appUrl}/set-password`,
    })

    await sendEmail(emailEnv.resendApiKey, {
      from: emailEnv.resendFromEmail,
      to: user.email,
      subject: "パスワードリセット - 勤怠管理システム",
      html: buildRecoveryEmailHtml(result.action_link),
    })

    return successResponse(c, { message: "パスワードリセットメールを送信しました" })
  } catch (e) {
    return handleAdminRouteError(c, e, { dbErrorAsNotFound: "User" })
  }
})

export default userEmailsRouter
