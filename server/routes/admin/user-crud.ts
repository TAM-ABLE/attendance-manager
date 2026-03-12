import { createRoute, z } from "@hono/zod-openapi"
import { adminDeleteUser, adminUpdateUser, goTrueAdminListUsers } from "../../lib/auth-helpers"
import {
  databaseError,
  handleAdminRouteError,
  handleRouteError,
  notFoundError,
  successResponse,
  validationError,
} from "../../lib/errors"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "../../lib/openapi-responses"
import {
  adminUpdateUserRequestSchema,
  adminUpdateUserResponseSchema,
  nullResponseSchema,
  successResponseSchema,
  userListResponseSchema,
  uuidSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const userCrudRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// ===== GET /admin/users - ユーザー一覧取得 =====

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

userCrudRouter.openapi(getUsersRoute, async (c) => {
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

userCrudRouter.openapi(updateUserRoute, async (c) => {
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
    return handleAdminRouteError(c, e)
  }
})

// ===== DELETE /admin/users/:userId - ユーザー削除 =====

const deleteUserRoute = createRoute({
  method: "delete",
  path: "/{userId}",
  tags: ["管理者"],
  summary: "ユーザー削除",
  description:
    "指定ユーザーを削除します。GoTrueとDBの両方から削除されます。管理者ユーザーは削除できません。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      userId: uuidSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: successResponseSchema(nullResponseSchema) },
      },
      description: "削除成功",
    },
    400: validationErrorResponse,
    404: notFoundResponse("ユーザーが見つからない"),
    500: serverErrorResponse,
  },
})

userCrudRouter.openapi(deleteUserRoute, async (c) => {
  const { userId } = c.req.valid("param")
  const { profile } = createRepos(c.env)

  try {
    // 管理者ユーザーの削除を防止
    const user = await profile.findById(userId)
    if (user.role === "admin") {
      return validationError(c, "管理者ユーザーは削除できません")
    }

    // 1. GoTrue からユーザー削除
    await adminDeleteUser(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, userId)

    // 2. DB から削除 (CASCADE で関連データも削除)
    await profile.deleteUser(userId)

    return successResponse(c, null)
  } catch (e) {
    return handleAdminRouteError(c, e, { dbErrorAsNotFound: "User" })
  }
})

export default userCrudRouter
