// shared/lib/schemas.ts
// フロントエンド・バックエンド共通のZodスキーマ

import { z } from "zod";
import {
    DATE_REGEX,
    YEAR_MONTH_REGEX,
    TIME_REGEX,
    MAX_TASK_HOURS,
    MIN_TASK_HOURS,
    MAX_TASK_NAME_LENGTH,
    MAX_TEXT_FIELD_LENGTH,
} from "./constants";

// ===== 基本スキーマ =====

/** YYYY-MM-DD形式の日付文字列 */
export const dateSchema = z.string().regex(DATE_REGEX, "Invalid date format (YYYY-MM-DD)");

/** YYYY-MM形式の年月文字列 */
export const yearMonthSchema = z.string().regex(YEAR_MONTH_REGEX, "Invalid year-month format (YYYY-MM)");

/** HH:MM形式の時刻文字列 */
export const timeSchema = z.string().regex(TIME_REGEX, "Invalid time format (HH:MM)");

/** 正のタイムスタンプ（ミリ秒） */
export const timestampSchema = z.number().positive("Timestamp must be positive");

/** UUID */
export const uuidSchema = z.string().uuid("Invalid UUID format");

// ===== タスク関連 =====

/** タスク（予定/実績） - shared/types/Attendance.ts の Task 型に対応 */
export const taskSchema = z.object({
    taskName: z.string().min(1, "Task name is required").max(MAX_TASK_NAME_LENGTH),
    hours: z.number().min(MIN_TASK_HOURS).max(MAX_TASK_HOURS).nullable(),
});

export type TaskInput = z.infer<typeof taskSchema>;

// ===== 休憩関連 =====

/** 休憩 - shared/types/Attendance.ts の Break 型に対応 */
export const breakSchema = z.object({
    id: uuidSchema,
    start: timestampSchema.nullable().optional(),
    end: timestampSchema.nullable().optional(),
});

export type BreakInput = z.infer<typeof breakSchema>;

// ===== 勤務セッション関連 =====

/** 勤務セッション - shared/types/Attendance.ts の WorkSession 型に対応 */
export const workSessionSchema = z.object({
    id: uuidSchema,
    clockIn: timestampSchema.optional(),
    clockOut: timestampSchema.optional(),
    breaks: z.array(breakSchema),
});

export type WorkSessionInput = z.infer<typeof workSessionSchema>;

/** 勤務セッション（更新用） - clockIn/clockOut の前後関係をバリデーション */
export const workSessionUpdateSchema = z
    .object({
        id: uuidSchema.optional(),
        clockIn: timestampSchema.nullable().optional(),
        clockOut: timestampSchema.nullable().optional(),
        breaks: z.array(breakSchema.extend({ id: uuidSchema.optional() })).optional().default([]),
    })
    .refine(
        (data) => {
            if (data.clockIn && data.clockOut) {
                return data.clockOut > data.clockIn;
            }
            return true;
        },
        { message: "clockOut must be after clockIn" }
    );

export type WorkSessionUpdateInput = z.infer<typeof workSessionUpdateSchema>;

// ===== 勤怠記録関連 =====

/** 勤怠記録 - shared/types/Attendance.ts の AttendanceRecord 型に対応 */
export const attendanceRecordSchema = z.object({
    date: dateSchema,
    sessions: z.array(workSessionSchema),
    workTotalMs: z.number().nonnegative(),
    breakTotalMs: z.number().nonnegative(),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;

// ===== 日報関連 =====

/** タスク種別 */
export const taskTypeSchema = z.enum(["planned", "actual"]);

export type TaskTypeInput = z.infer<typeof taskTypeSchema>;

/** 日報タスク - shared/types/DailyReport.ts の DailyReportTask 型に対応 */
export const dailyReportTaskSchema = z.object({
    id: uuidSchema,
    taskType: taskTypeSchema,
    taskName: z.string().min(1).max(MAX_TASK_NAME_LENGTH),
    hours: z.number().min(MIN_TASK_HOURS).max(MAX_TASK_HOURS).nullable(),
    sortOrder: z.number().int().nonnegative(),
});

export type DailyReportTaskInput = z.infer<typeof dailyReportTaskSchema>;

/** 日報テキストフィールド（summary, issues, notes）*/
export const reportTextFieldSchema = z.string().max(MAX_TEXT_FIELD_LENGTH).nullable();

// ===== ユーザー関連 =====

/** ユーザー - shared/types/Attendance.ts の User 型に対応 */
export const userSchema = z.object({
    id: uuidSchema,
    name: z.string().min(1),
    email: z.string().email(),
    employeeId: z.string().min(1),
});

export type UserInput = z.infer<typeof userSchema>;
