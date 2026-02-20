import crypto from "node:crypto"
import { createRoute, z } from "@hono/zod-openapi"
import { parseYearMonth } from "@/lib/time"
import { adminCreateUser, adminUpdateUser } from "../../lib/auth-helpers"
import {
  databaseError,
  internalError,
  notFoundError,
  successResponse,
  validationError,
} from "../../lib/errors"
import { formatAttendanceRecord, formatWorkSessions } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  adminCreateUserRequestSchema,
  adminCreateUserResponseSchema,
  adminUpdateUserRequestSchema,
  adminUpdateUserResponseSchema,
  attendanceRecordSchema,
  dateSchema,
  errorResponseSchema,
  successResponseSchema,
  updateSessionsRequestSchema,
  userListResponseSchema,
  uuidSchema,
  workSessionSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import { replaceSessions } from "../../lib/sessions"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const usersRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const nullResponseSchema = z.null().openapi({ description: "null" })

const getUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["管理者"],
  summary: "ユーザー一覧取得",
  description: "全ユーザーの一覧を取得します。",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(userListResponseSchema),
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

usersRouter.openapi(getUsersRoute, async (c) => {
  const { profile } = createRepos(c.env)

  try {
    const data = await profile.findAllUsers()

    const users = data.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      employeeNumber: u.employee_number,
      role: u.role as "admin" | "user",
    }))

    return successResponse(c, users)
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

// ===== POST /admin/users - 管理者によるユーザー作成 =====

function generateNextEmployeeNumber(maxNumber: string | null): string {
  if (!maxNumber) return "A-0001"
  const num = Number.parseInt(maxNumber.replace("A-", ""), 10)
  return `A-${String(num + 1).padStart(4, "0")}`
}

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const PASSWORD_CHARS = LETTERS + DIGITS
const PASSWORD_LENGTH = 12

function getRandomChar(chars: string): string {
  const maxUnbiased = Math.floor(256 / chars.length) * chars.length
  while (true) {
    const byte = crypto.randomBytes(1)[0]
    if (byte < maxUnbiased) {
      return chars[byte % chars.length]
    }
  }
}

function generateRandomPassword(): string {
  const chars: string[] = []
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    chars.push(getRandomChar(PASSWORD_CHARS))
  }
  // 英字・数字を最低1文字ずつ保証
  if (!chars.some((c) => LETTERS.includes(c))) {
    chars[0] = getRandomChar(LETTERS)
  }
  if (!chars.some((c) => DIGITS.includes(c))) {
    chars[1] = getRandomChar(DIGITS)
  }
  return chars.join("")
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
        "application/json": {
          schema: successResponseSchema(adminCreateUserResponseSchema),
        },
      },
      description: "作成成功",
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

usersRouter.openapi(createUserRoute, async (c) => {
  const { lastName, firstName, email } = c.req.valid("json")
  const name = `${lastName} ${firstName}`
  const { profile } = createRepos(c.env)
  const initialPassword = generateRandomPassword()

  try {
    const maxNumber = await profile.findMaxEmployeeNumber()
    const employeeNumber = generateNextEmployeeNumber(maxNumber)

    const user = await adminCreateUser(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role: "user",
        employee_number: employeeNumber,
        password_changed: false,
      },
    })

    return successResponse(c, {
      id: user.id,
      name,
      email: user.email ?? email,
      employeeNumber,
      role: "user" as const,
      initialPassword,
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
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
        "application/json": {
          schema: successResponseSchema(adminUpdateUserResponseSchema),
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
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "ユーザーが見つからない",
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
      employeeNumber: updated.employee_number,
      role: updated.role as "admin" | "user",
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
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
        "application/json": {
          schema: successResponseSchema(z.array(attendanceRecordSchema)),
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

usersRouter.openapi(getUserMonthlyRoute, async (c) => {
  const { userId, yearMonth } = c.req.valid("param")

  const parsed = parseYearMonth(yearMonth)
  if (!parsed) {
    return validationError(c, "Invalid year-month format")
  }
  const { year, month } = parsed

  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordsByDateRange(userId, start, end)
    return successResponse(c, data.map(formatAttendanceRecord))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
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

usersRouter.openapi(getUserSessionsRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { attendance } = createRepos(c.env)

  try {
    const data = await attendance.findRecordWithSessions(userId, date)

    if (!data?.workSessions || !Array.isArray(data.workSessions)) {
      return successResponse(c, [])
    }

    return successResponse(c, formatWorkSessions(data.workSessions))
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
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
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default usersRouter
