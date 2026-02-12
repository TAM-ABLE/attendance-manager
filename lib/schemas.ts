// shared/lib/schemas.ts
// フロントエンド・バックエンド共通のZodスキーマ

import { z } from "zod"
import {
  DATE_REGEX,
  MAX_TASK_HOURS,
  MAX_TASK_NAME_LENGTH,
  MAX_TEXT_FIELD_LENGTH,
  MIN_TASK_HOURS,
  TIME_REGEX,
  YEAR_MONTH_REGEX,
} from "./constants"

// ===== 基本スキーマ =====

/** YYYY-MM-DD形式の日付文字列 */
export const dateSchema = z.string().regex(DATE_REGEX, "Invalid date format (YYYY-MM-DD)")

/** YYYY-MM形式の年月文字列 */
export const yearMonthSchema = z
  .string()
  .regex(YEAR_MONTH_REGEX, "Invalid year-month format (YYYY-MM)")

/** HH:MM形式の時刻文字列 */
export const timeSchema = z.string().regex(TIME_REGEX, "Invalid time format (HH:MM)")

/** 正のタイムスタンプ（ミリ秒） */
export const timestampSchema = z.number().positive("Timestamp must be positive")

/** UUID */
export const uuidSchema = z.string().uuid("Invalid UUID format")

// ===== タスク関連 =====

/** タスク（予定/実績） - shared/types/Attendance.ts の Task 型に対応 */
export const taskSchema = z.object({
  taskName: z.string().min(1, "Task name is required").max(MAX_TASK_NAME_LENGTH),
  hours: z.number().min(MIN_TASK_HOURS).max(MAX_TASK_HOURS).nullable(),
})

export type Task = z.infer<typeof taskSchema>

// ===== 休憩関連 =====

/** 休憩 */
export const breakSchema = z.object({
  id: uuidSchema,
  start: z.number().nullable(),
  end: z.number().nullable(),
})

export type Break = z.infer<typeof breakSchema>

// ===== 勤務セッション関連 =====

/** 勤務セッション */
export const workSessionSchema = z.object({
  id: uuidSchema,
  clockIn: z.number().nullable(),
  clockOut: z.number().nullable(),
  breaks: z.array(breakSchema),
})

export type WorkSession = z.infer<typeof workSessionSchema>

/** 勤務セッション（更新用） - clockIn/clockOut の前後関係をバリデーション */
export const workSessionUpdateSchema = z
  .object({
    id: uuidSchema.optional(),
    clockIn: timestampSchema.nullable().optional(),
    clockOut: timestampSchema.nullable().optional(),
    breaks: z
      .array(breakSchema.extend({ id: uuidSchema.optional() }))
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      if (data.clockIn && data.clockOut) {
        return data.clockOut > data.clockIn
      }
      return true
    },
    { message: "clockOut must be after clockIn" },
  )

export type WorkSessionUpdate = z.infer<typeof workSessionUpdateSchema>

// ===== 勤怠記録関連 =====

/** 勤怠記録 - shared/types/Attendance.ts の AttendanceRecord 型に対応 */
export const attendanceRecordSchema = z.object({
  date: dateSchema,
  sessions: z.array(workSessionSchema),
  workTotalMs: z.number().nonnegative(),
  breakTotalMs: z.number().nonnegative(),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>

// ===== 日報関連 =====

/** タスク種別 */
export const taskTypeSchema = z.enum(["planned", "actual"])

export type TaskType = z.infer<typeof taskTypeSchema>

/** 日報タスク - shared/types/DailyReport.ts の DailyReportTask 型に対応 */
export const dailyReportTaskSchema = z.object({
  id: uuidSchema,
  taskType: taskTypeSchema,
  taskName: z.string().min(1).max(MAX_TASK_NAME_LENGTH),
  hours: z.number().min(MIN_TASK_HOURS).max(MAX_TASK_HOURS).nullable(),
  sortOrder: z.number().int().nonnegative(),
})

export type DailyReportTask = z.infer<typeof dailyReportTaskSchema>

/** 日報 */
export const dailyReportSchema = z.object({
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

export type DailyReport = z.infer<typeof dailyReportSchema>

/** 日報一覧用の軽量型 */
export const dailyReportListItemSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  userName: z.string(),
  employeeNumber: z.string(),
  date: dateSchema,
  submittedAt: z.number().nullable(),
  plannedTaskCount: z.number(),
  actualTaskCount: z.number(),
})

export type DailyReportListItem = z.infer<typeof dailyReportListItemSchema>

/** ユーザー選択用 */
export const userForSelectSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  employeeNumber: z.string(),
})

export type UserForSelect = z.infer<typeof userForSelectSchema>

/** 日報テキストフィールド（summary, issues, notes）*/
export const reportTextFieldSchema = z.string().max(MAX_TEXT_FIELD_LENGTH).nullable()

// ===== ユーザー関連 =====

/** ユーザー - shared/types/Attendance.ts の User 型に対応 */
export const userSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  email: z.string().email(),
  employeeNumber: z.string().min(1),
  role: z.enum(["admin", "user"]),
})

export type User = z.infer<typeof userSchema>
