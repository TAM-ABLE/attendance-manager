// backend/lib/openapi-schemas.ts
// OpenAPI用のZodスキーマ定義
// 共通スキーマは shared/lib/schemas.ts から import し、OpenAPI メタデータを付与

import { MAX_TEXT_FIELD_LENGTH } from "@attendance-manager/shared/lib/constants"
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
} from "@attendance-manager/shared/lib/schemas"
import { z } from "@hono/zod-openapi"

// ===== shared スキーマの型安全な OpenAPI メタデータ付与 =====
// @hono/zod-openapi は extendZodWithOpenApi で ZodType.prototype を拡張するため、
// shared のスキーマにも .openapi() が実行時に使える。
// 型レベルで認識させるためにヘルパーで any にキャストする。

function withOpenApi<T>(schema: T, metadata: string | Record<string, unknown>): T {
  const name = typeof metadata === "string" ? metadata : undefined
  const config = typeof metadata === "string" ? { title: metadata } : metadata
  // biome-ignore lint/suspicious/noExplicitAny: OpenAPI extension needs any cast
  return (schema as any).openapi(name ?? config.title, config) as T
}

// 型は shared からインポート（Single Source of Truth）
export type {
  AttendanceRecord,
  Break,
  DailyReportTask,
  Task,
  User,
  WorkSession,
} from "@attendance-manager/shared/lib/schemas"

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

// ===== APIエラー（backend固有）=====

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

// ===== 認証関連（backend固有）=====

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
    accessToken: z.string().openapi({
      description: "アクセストークン（API認証用）",
    }),
    user: z.object({
      id: uuidSchema,
      name: z.string(),
      email: z.email(),
      role: z.enum(["admin", "user"]),
    }),
  })
  .openapi("LoginResponse")

export const registerRequestSchema = z
  .object({
    name: z.string().min(1).openapi({
      description: "ユーザー名",
      example: "山田太郎",
    }),
    email: z.email().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
    password: z.string().min(6).openapi({
      description: "パスワード（6文字以上）",
      example: "password123",
    }),
    employeeNumber: z.string().min(1).openapi({
      description: "社員番号",
      example: "EMP001",
    }),
    role: z.enum(["admin", "user"]).default("user").openapi({
      description: "ユーザー権限",
      example: "user",
    }),
  })
  .openapi("RegisterRequest")

export type RegisterRequest = z.infer<typeof registerRequestSchema>

// registerResponseSchema は login と同じ形式（登録後すぐにログイン状態にする）
export const registerResponseSchema = z
  .object({
    accessToken: z.string().openapi({
      description: "アクセストークン（API認証用）",
    }),
    user: z.object({
      id: uuidSchema,
      name: z.string(),
      email: z.email(),
      role: z.enum(["admin", "user"]),
    }),
  })
  .openapi("RegisterResponse")

// ===== 打刻関連（backend固有）=====

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

// 休憩開始リクエスト
export const breakStartRequestSchema = z
  .object({
    breakStartTime: z.string().datetime().optional().openapi({
      description: "休憩開始時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T12:00:00.000Z",
    }),
  })
  .openapi("BreakStartRequest")

export type BreakStartRequest = z.infer<typeof breakStartRequestSchema>

// 休憩終了リクエスト
export const breakEndRequestSchema = z
  .object({
    breakEndTime: z.string().datetime().optional().openapi({
      description: "休憩終了時刻（ISO 8601形式）。省略時は現在時刻",
      example: "2025-01-15T13:00:00.000Z",
    }),
  })
  .openapi("BreakEndRequest")

export type BreakEndRequest = z.infer<typeof breakEndRequestSchema>

// ===== 週間合計（backend固有）=====

export const weekTotalResponseSchema = z
  .object({
    netWorkMs: z.number().nonnegative().openapi({
      description: "週間勤務時間（ミリ秒）",
      example: 144000000,
    }),
  })
  .openapi("WeekTotalResponse")

// ===== 管理者API（backend固有）=====

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

// ===== レスポンススキーマ（backend固有の合成）=====

export const userListResponseSchema = z.array(userSchema).openapi("UserList")

export const dailyReportListResponseSchema = z
  .object({
    user: userForSelectSchema,
    yearMonth: yearMonthSchema,
    reports: z.array(dailyReportListItemSchema),
  })
  .openapi("DailyReportListResponse")

// dailyReportDetailResponseSchema は dailyReportSchema を直接返す
export const dailyReportDetailResponseSchema = dailyReportSchema

// usersForSelectResponseSchema は配列を直接返す
export const usersForSelectResponseSchema = z.array(userForSelectSchema).openapi("UsersForSelect")
