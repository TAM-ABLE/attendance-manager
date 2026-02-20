import { z } from "@hono/zod-openapi"
import { MAX_TEXT_FIELD_LENGTH } from "@/lib/constants"
import {
  attendanceRecordSchema as _attendanceRecordSchema,
  breakSchema as _breakSchema,
  dailyReportListItemSchema as _dailyReportListItemSchema,
  dailyReportSchema as _dailyReportSchema,
  dailyReportTaskSchema as _dailyReportTaskSchema,
  dateSchema as _dateSchema,
  taskSchema as _taskSchema,
  timestampSchema as _timestampSchema,
  userForSelectSchema as _userForSelectSchema,
  userSchema as _userSchema,
  uuidSchema as _uuidSchema,
  workSessionSchema as _workSessionSchema,
  yearMonthSchema as _yearMonthSchema,
} from "@/lib/schemas"

function withOpenApi<T>(schema: T, metadata: string | Record<string, unknown>): T {
  const name = typeof metadata === "string" ? metadata : undefined
  const config = typeof metadata === "string" ? { title: metadata } : metadata
  // biome-ignore lint/suspicious/noExplicitAny: OpenAPI extension needs any cast
  return (schema as any).openapi(name ?? config.title, config) as T
}

export type {
  AttendanceRecord,
  Break,
  DailyReportTask,
  Task,
  User,
  WorkSession,
} from "@/lib/schemas"

// ===== 基本スキーマ（shared から re-export + OpenAPI メタデータ）=====

export const dateSchema = withOpenApi(_dateSchema, {
  title: "Date",
  description: "日付 (YYYY-MM-DD形式)",
  example: "2025-01-15",
})

export const yearMonthSchema = withOpenApi(_yearMonthSchema, {
  title: "YearMonth",
  description: "年月 (YYYY-MM形式)",
  example: "2025-01",
})

export const uuidSchema = withOpenApi(_uuidSchema, {
  title: "UUID",
  description: "UUID",
  example: "550e8400-e29b-41d4-a716-446655440000",
})

export const timestampSchema = withOpenApi(_timestampSchema, {
  title: "Timestamp",
  description: "タイムスタンプ（ミリ秒）",
  example: 1705312800000,
})

// ===== タスク・休憩・セッション・勤怠スキーマ（shared → OpenAPI）=====

export const taskSchema = withOpenApi(_taskSchema, "Task")
export const breakSchema = withOpenApi(_breakSchema, "Break")
export const workSessionSchema = withOpenApi(_workSessionSchema, "WorkSession")
export const attendanceRecordSchema = withOpenApi(_attendanceRecordSchema, "AttendanceRecord")

// ===== ユーザー関連（shared → OpenAPI）=====

export const userSchema = withOpenApi(_userSchema, "User")
export const userForSelectSchema = withOpenApi(_userForSelectSchema, "UserForSelect")

// ===== 日報関連（shared → OpenAPI）=====

export const dailyReportTaskSchema = withOpenApi(_dailyReportTaskSchema, "DailyReportTask")
export const dailyReportListItemSchema = withOpenApi(
  _dailyReportListItemSchema,
  "DailyReportListItem",
)
export const dailyReportSchema = withOpenApi(_dailyReportSchema, "DailyReport")

// ===== APIエラー =====

export const apiErrorSchema = z
  .object({
    code: z.string().openapi({ example: "VALIDATION_ERROR" }),
    message: z.string().openapi({ example: "Invalid request" }),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("ApiError")

// ===== 成功レスポンス =====

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: apiErrorSchema,
  })
  .openapi("ErrorResponse")

// ===== 認証関連 =====

export const loginRequestSchema = z
  .object({
    email: z.email().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
    password: z.string().min(1).openapi({
      description: "パスワード",
      example: "password123",
    }),
  })
  .openapi("LoginRequest")

export type LoginRequest = z.infer<typeof loginRequestSchema>

export const loginResponseSchema = z
  .object({
    user: z.object({
      id: uuidSchema,
      name: z.string(),
      email: z.email(),
      role: z.enum(["admin", "user"]),
    }),
  })
  .openapi("LoginResponse")

// ===== 初回ログイン =====

export const firstLoginRequestSchema = z
  .object({
    email: z.email().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
    currentPassword: z.string().min(1).openapi({
      description: "現在のパスワード（管理者から受け取った初期パスワード）",
      example: "initialPass123",
    }),
    newPassword: z
      .string()
      .min(8)
      .regex(/[a-zA-Z]/, "英字を含めてください")
      .regex(/[0-9]/, "数字を含めてください")
      .openapi({
        description: "新しいパスワード（8文字以上、英字・数字を含む）",
        example: "newPassword456",
      }),
  })
  .openapi("FirstLoginRequest")

export type FirstLoginRequest = z.infer<typeof firstLoginRequestSchema>

export const firstLoginResponseSchema = z
  .object({
    user: z.object({
      id: uuidSchema,
      name: z.string(),
      email: z.email(),
      role: z.enum(["admin", "user"]),
    }),
  })
  .openapi("FirstLoginResponse")

// ===== 管理者ユーザー登録 =====

export const adminCreateUserRequestSchema = z
  .object({
    lastName: z.string().trim().min(1).openapi({
      description: "姓",
      example: "山田",
    }),
    firstName: z.string().trim().min(1).openapi({
      description: "名",
      example: "太郎",
    }),
    email: z.email().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
  })
  .openapi("AdminCreateUserRequest")

export type AdminCreateUserRequest = z.infer<typeof adminCreateUserRequestSchema>

export const adminCreateUserResponseSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    email: z.email(),
    employeeNumber: z.string(),
    role: z.literal("user"),
    initialPassword: z.string().openapi({
      description: "自動生成された初期パスワード",
    }),
  })
  .openapi("AdminCreateUserResponse")

// ===== 管理者ユーザー編集 =====

export const adminUpdateUserRequestSchema = z
  .object({
    lastName: z.string().trim().min(1).optional().openapi({
      description: "姓",
      example: "山田",
    }),
    firstName: z.string().trim().min(1).optional().openapi({
      description: "名",
      example: "太郎",
    }),
    email: z.email().optional().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
  })
  .openapi("AdminUpdateUserRequest")

export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserRequestSchema>

export const adminUpdateUserResponseSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    email: z.email(),
    employeeNumber: z.string(),
    role: z.enum(["admin", "user"]),
  })
  .openapi("AdminUpdateUserResponse")

// ===== 打刻関連 =====

export const clockInRequestSchema = z
  .object({
    userName: z.string().min(1).openapi({
      description: "ユーザー名（Slack通知用）",
      example: "山田太郎",
    }),
    plannedTasks: z.array(taskSchema).openapi({
      description: "予定タスク一覧",
    }),
    clockInTime: z.string().datetime().optional().openapi({
      description: "出勤時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T09:00:00.000Z",
    }),
  })
  .openapi("ClockInRequest")

export type ClockInRequest = z.infer<typeof clockInRequestSchema>

export const clockOutRequestSchema = z
  .object({
    userName: z.string().min(1).openapi({
      description: "ユーザー名（Slack通知用）",
      example: "山田太郎",
    }),
    actualTasks: z.array(taskSchema).openapi({
      description: "実績タスク一覧",
    }),
    summary: z.string().max(MAX_TEXT_FIELD_LENGTH).optional().openapi({
      description: "業務サマリー",
    }),
    issues: z.string().max(MAX_TEXT_FIELD_LENGTH).optional().openapi({
      description: "課題・問題点",
    }),
    notes: z.string().max(MAX_TEXT_FIELD_LENGTH).optional().openapi({
      description: "備考",
    }),
    clockOutTime: z.string().datetime().optional().openapi({
      description: "退勤時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T18:00:00.000Z",
    }),
  })
  .openapi("ClockOutRequest")

export type ClockOutRequest = z.infer<typeof clockOutRequestSchema>

export const clockResponseSchema = z
  .object({
    slack_ts: z.string().optional().openapi({
      description: "Slackメッセージのタイムスタンプ",
    }),
  })
  .openapi("ClockResponse")

export const breakStartRequestSchema = z
  .object({
    breakStartTime: z.string().datetime().optional().openapi({
      description: "休憩開始時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T12:00:00.000Z",
    }),
  })
  .openapi("BreakStartRequest")

export type BreakStartRequest = z.infer<typeof breakStartRequestSchema>

export const breakEndRequestSchema = z
  .object({
    breakEndTime: z.string().datetime().optional().openapi({
      description: "休憩終了時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T13:00:00.000Z",
    }),
  })
  .openapi("BreakEndRequest")

export type BreakEndRequest = z.infer<typeof breakEndRequestSchema>

// ===== 週間合計 =====

export const weekTotalResponseSchema = z
  .object({
    netWorkMs: z.number().nonnegative().openapi({
      description: "週間勤務時間（ミリ秒）",
      example: 144000000,
    }),
  })
  .openapi("WeekTotalResponse")

// ===== 管理者API =====

export const sessionUpdateSchema = z
  .object({
    id: uuidSchema.optional(),
    clockIn: z.number().nullable().optional(),
    clockOut: z.number().nullable().optional(),
    breaks: z
      .array(
        z.object({
          id: z.string().optional(),
          start: z.number().nullable().optional(),
          end: z.number().nullable().optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .openapi("SessionUpdate")

export const updateSessionsRequestSchema = z
  .object({
    sessions: z.array(sessionUpdateSchema),
  })
  .openapi("UpdateSessionsRequest")

export type UpdateSessionsRequest = z.infer<typeof updateSessionsRequestSchema>

// ===== パラメータスキーマ =====

export const yearMonthParamsSchema = z.object({
  yearMonth: yearMonthSchema,
})

export type YearMonthParams = z.infer<typeof yearMonthParamsSchema>

export const userDateParamsSchema = z.object({
  userId: uuidSchema,
  date: dateSchema,
})

export type UserDateParams = z.infer<typeof userDateParamsSchema>

export const userYearMonthParamsSchema = z.object({
  userId: uuidSchema,
  yearMonth: yearMonthSchema,
})

export type UserYearMonthParams = z.infer<typeof userYearMonthParamsSchema>

export const reportIdParamsSchema = z.object({
  id: uuidSchema,
})

export type ReportIdParams = z.infer<typeof reportIdParamsSchema>

// ===== レスポンススキーマ =====

export const userListResponseSchema = z.array(userSchema).openapi("UserList")

export const dailyReportListResponseSchema = z
  .object({
    user: userForSelectSchema,
    yearMonth: yearMonthSchema,
    reports: z.array(dailyReportListItemSchema),
  })
  .openapi("DailyReportListResponse")

export const dailyReportDetailResponseSchema = dailyReportSchema

export const usersForSelectResponseSchema = z.array(userForSelectSchema).openapi("UsersForSelect")
