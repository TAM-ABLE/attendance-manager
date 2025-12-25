// backend/lib/schemas.ts
// バックエンドAPI固有のZodスキーマ
// 共通スキーマは shared/lib/schemas.ts から再エクスポート

import { z } from "zod";
import { MAX_TEXT_FIELD_LENGTH } from "../../shared/lib/constants";

// ===== 共通スキーマの再エクスポート =====
export {
    // 基本スキーマ
    dateSchema,
    yearMonthSchema,
    timeSchema,
    timestampSchema,
    uuidSchema,
    // タスク関連
    taskSchema,
    type TaskInput,
    // 休憩関連
    breakSchema,
    type BreakInput,
    // 勤務セッション関連
    workSessionSchema,
    type WorkSessionInput,
    workSessionUpdateSchema,
    type WorkSessionUpdateInput,
    // 勤怠記録関連
    attendanceRecordSchema,
    type AttendanceRecordInput,
    // 日報関連
    taskTypeSchema,
    type TaskTypeInput,
    dailyReportTaskSchema,
    type DailyReportTaskInput,
    reportTextFieldSchema,
    // ユーザー関連
    userSchema,
    type UserInput,
} from "../../shared/lib/schemas";

// ===== バックエンドAPI固有のスキーマ =====
import { dateSchema, yearMonthSchema, uuidSchema, taskSchema } from "../../shared/lib/schemas";

// ----- 打刻リクエスト -----

/** 出勤リクエスト */
export const clockInRequestSchema = z.object({
    userName: z.string().min(1, "User name is required"),
    plannedTasks: z.array(taskSchema),
});

export type ClockInRequest = z.infer<typeof clockInRequestSchema>;

/** 退勤リクエスト */
export const clockOutRequestSchema = z.object({
    userName: z.string().min(1, "User name is required"),
    actualTasks: z.array(taskSchema),
    summary: z.string().max(MAX_TEXT_FIELD_LENGTH).optional(),
    issues: z.string().max(MAX_TEXT_FIELD_LENGTH).optional(),
    notes: z.string().max(MAX_TEXT_FIELD_LENGTH).optional(),
});

export type ClockOutRequest = z.infer<typeof clockOutRequestSchema>;

// ----- 管理者API -----

/** セッション一括更新リクエスト */
export const updateSessionsRequestSchema = z.object({
    sessions: z.array(
        z
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
                        })
                    )
                    .optional()
                    .default([]),
            })
            .refine(
                (data) => {
                    if (data.clockIn && data.clockOut) {
                        return data.clockOut > data.clockIn;
                    }
                    return true;
                },
                { message: "clockOut must be after clockIn" }
            )
    ),
});

export type UpdateSessionsRequest = z.infer<typeof updateSessionsRequestSchema>;

// ----- URLパラメータ -----

/** ユーザーID + 日付パラメータ */
export const userDateParamsSchema = z.object({
    userId: uuidSchema,
    date: dateSchema,
});

export type UserDateParams = z.infer<typeof userDateParamsSchema>;

/** 年月パラメータ */
export const yearMonthParamsSchema = z.object({
    yearMonth: yearMonthSchema,
});

export type YearMonthParams = z.infer<typeof yearMonthParamsSchema>;

// ----- 認証リクエスト -----

/** ログインリクエスト */
export const loginRequestSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** ユーザー登録リクエスト */
export const registerRequestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    employeeId: z.string().min(1, "Employee ID is required"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
