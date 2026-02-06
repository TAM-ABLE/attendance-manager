// backend/lib/openapi-schemas.ts
// OpenAPI用のZodスキーマ定義
// 型は shared/lib/schemas.ts と同期（Single Source of Truth）

import {
  DATE_REGEX,
  MAX_TASK_HOURS,
  MAX_TASK_NAME_LENGTH,
  MAX_TEXT_FIELD_LENGTH,
  MIN_TASK_HOURS,
  YEAR_MONTH_REGEX,
} from "@attendance-manager/shared/lib/constants"
import { z } from "@hono/zod-openapi"

// 型は shared からインポート（Single Source of Truth）
export type {
  AttendanceRecord,
  Break,
  DailyReportTask,
  Task,
  User,
  WorkSession,
} from "@attendance-manager/shared/lib/schemas"

// ===== 基本スキーマ =====

export const dateSchema = z.string().regex(DATE_REGEX).openapi({
  description: "日付 (YYYY-MM-DD形式)",
  example: "2025-01-15",
})

export const yearMonthSchema = z.string().regex(YEAR_MONTH_REGEX).openapi({
  description: "年月 (YYYY-MM形式)",
  example: "2025-01",
})

export const uuidSchema = z.string().uuid().openapi({
  description: "UUID",
  example: "550e8400-e29b-41d4-a716-446655440000",
})

export const timestampSchema = z.number().positive().openapi({
  description: "タイムスタンプ（ミリ秒）",
  example: 1705312800000,
})

// ===== タスク関連 =====

export const taskSchema = z
  .object({
    taskName: z.string().min(1).max(MAX_TASK_NAME_LENGTH).openapi({
      description: "タスク名",
      example: "機能Aの実装",
    }),
    hours: z.number().min(MIN_TASK_HOURS).max(MAX_TASK_HOURS).nullable().openapi({
      description: "作業時間（時間）",
      example: 2.5,
    }),
  })
  .openapi("Task")

// ===== 休憩関連 =====

export const breakSchema = z
  .object({
    id: uuidSchema,
    start: z.number().nullable().openapi({ description: "休憩開始時刻（ミリ秒）" }),
    end: z.number().nullable().openapi({ description: "休憩終了時刻（ミリ秒）" }),
  })
  .openapi("Break")

// ===== 勤務セッション関連 =====

export const workSessionSchema = z
  .object({
    id: uuidSchema,
    clockIn: z.number().nullable().openapi({ description: "出勤時刻（ミリ秒）" }),
    clockOut: z.number().nullable().openapi({ description: "退勤時刻（ミリ秒）" }),
    breaks: z.array(breakSchema),
  })
  .openapi("WorkSession")

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

// ===== 勤怠記録 =====

export const attendanceRecordSchema = z
  .object({
    date: dateSchema,
    sessions: z.array(workSessionSchema),
    workTotalMs: z.number().nonnegative().openapi({
      description: "勤務時間合計（ミリ秒）",
    }),
    breakTotalMs: z.number().nonnegative().openapi({
      description: "休憩時間合計（ミリ秒）",
    }),
  })
  .openapi("AttendanceRecord")

export const weekTotalResponseSchema = z
  .object({
    netWorkMs: z.number().nonnegative().openapi({
      description: "週間勤務時間（ミリ秒）",
      example: 144000000,
    }),
  })
  .openapi("WeekTotalResponse")

// ===== ユーザー関連 =====

export const userSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    email: z.email(),
    employeeNumber: z.string(),
  })
  .openapi("User")

// userListResponseSchema は配列を直接返す（A案: シンプルなレスポンス）
export const userListResponseSchema = z.array(userSchema).openapi("UserList")

export const userForSelectSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    employeeNumber: z.string(),
  })
  .openapi("UserForSelect")

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

// ===== 日報関連 =====

export const dailyReportTaskSchema = z
  .object({
    id: uuidSchema,
    taskType: z.enum(["planned", "actual"]),
    taskName: z.string(),
    hours: z.number().nullable(),
    sortOrder: z.number(),
  })
  .openapi("DailyReportTask")

export const dailyReportListItemSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    userName: z.string(),
    employeeNumber: z.string(),
    date: dateSchema,
    submittedAt: z.number().nullable(),
    plannedTaskCount: z.number(),
    actualTaskCount: z.number(),
  })
  .openapi("DailyReportListItem")

export const dailyReportSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    date: dateSchema,
    summary: z.string().nullable(),
    issues: z.string().nullable(),
    notes: z.string().nullable(),
    submittedAt: z.number().nullable(),
    plannedTasks: z.array(dailyReportTaskSchema),
    actualTasks: z.array(dailyReportTaskSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .openapi("DailyReport")

export const dailyReportListResponseSchema = z
  .object({
    user: userForSelectSchema,
    yearMonth: yearMonthSchema,
    reports: z.array(dailyReportListItemSchema),
  })
  .openapi("DailyReportListResponse")

// dailyReportDetailResponseSchema は dailyReportSchema を直接返す（A案）
export const dailyReportDetailResponseSchema = dailyReportSchema

// usersForSelectResponseSchema は配列を直接返す（A案）
export const usersForSelectResponseSchema = z.array(userForSelectSchema).openapi("UsersForSelect")
