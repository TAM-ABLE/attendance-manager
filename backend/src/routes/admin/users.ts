// backend/src/routes/admin/users.ts
import { createRoute, z } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../../lib/supabase";
import { parseYearMonth } from "../../../lib/time";
import { formatAttendanceRecord, DbAttendanceRecord } from "../../../lib/formatters";
import { databaseError, validationError, successResponse } from "../../../lib/errors";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import {
    userListResponseSchema,
    attendanceRecordSchema,
    workSessionSchema,
    updateSessionsRequestSchema,
    uuidSchema,
    dateSchema,
    yearMonthSchema,
    errorResponseSchema,
    successResponseSchema,
} from "../../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const usersRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

const nullResponseSchema = z.null().openapi({ description: "null" });

// GET /admin/users - ユーザー一覧
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
});

usersRouter.openapi(getUsersRoute, async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from("users")
        .select("id, name, email, employee_number")
        .order("employee_number", { ascending: true });

    if (error) {
        return databaseError(c, error.message);
    }

    const users = data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        employeeNumber: u.employee_number,
    }));

    return successResponse(c, users);
});

// GET /admin/users/:userId/attendance/month/:yearMonth - ユーザーの月次勤怠
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
});

usersRouter.openapi(getUserMonthlyRoute, async (c) => {
    const { userId, yearMonth } = c.req.valid("param");

    const parsed = parseYearMonth(yearMonth);
    if (!parsed) {
        return validationError(c, "Invalid year-month format");
    }
    const { year, month } = parsed;

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from("attendance_records")
        .select(
            `
            id,
            date,
            work_sessions (
                id,
                clock_in,
                clock_out,
                breaks ( id, break_start, break_end )
            )
        `
        )
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date");

    if (error) {
        return databaseError(c, error.message);
    }

    return successResponse(c, (data as DbAttendanceRecord[]).map(formatAttendanceRecord));
});

// GET /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション取得
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
});

usersRouter.openapi(getUserSessionsRoute, async (c) => {
    const { userId, date } = c.req.valid("param");

    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from("attendance_records")
        .select(
            `
            id,
            date,
            work_sessions (
                id,
                clock_in,
                clock_out,
                breaks (
                    id,
                    break_start,
                    break_end
                )
            )
        `
        )
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle<DbAttendanceRecord>();

    if (error) {
        return databaseError(c, error.message);
    }

    if (!data?.work_sessions || !Array.isArray(data.work_sessions)) {
        return successResponse(c, []);
    }

    // Convert to schema format (null instead of undefined)
    const sessions = data.work_sessions.map((s) => ({
        id: s.id,
        clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
        clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
        breaks: s.breaks.map((b) => ({
            id: b.id,
            start: b.break_start ? new Date(b.break_start).getTime() : null,
            end: b.break_end ? new Date(b.break_end).getTime() : null,
        })),
    }));

    return successResponse(c, sessions);
});

// PUT /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション更新
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
});

usersRouter.openapi(updateUserSessionsRoute, async (c) => {
    const { userId, date } = c.req.valid("param");
    const { sessions } = c.req.valid("json");

    const supabase = getSupabaseClient(c.env);

    // attendance_records を取得 or 作成
    const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

    let attendanceId: string;

    if (attendanceData) {
        attendanceId = attendanceData.id;

        // 既存データ削除
        const { data: oldSessions } = await supabase
            .from("work_sessions")
            .select("id")
            .eq("attendance_id", attendanceId);

        const ids = oldSessions?.map((s) => s.id) || [];

        if (ids.length > 0) {
            await supabase.from("breaks").delete().in("session_id", ids);
            await supabase.from("work_sessions").delete().in("id", ids);
        }
    } else {
        const { data: newRecord, error: err } = await supabase
            .from("attendance_records")
            .insert({ user_id: userId, date })
            .select()
            .single();

        if (err || !newRecord) {
            return databaseError(c, err?.message || "Failed to create attendance");
        }

        attendanceId = newRecord.id;
    }

    // バリデーション（先に全てチェック）
    const validSessions = sessions.filter((s) => s.clockIn != null);
    for (const s of validSessions) {
        if (s.clockOut && s.clockOut < s.clockIn!) {
            return validationError(c, "Clock out time must be after clock in time");
        }
        for (const br of s.breaks || []) {
            if (!br.start) continue;
            if (br.end && br.end < br.start) {
                return validationError(c, "Break end time must be after break start time");
            }
            // 休憩がセッション時間内かチェック
            if (br.start < s.clockIn!) {
                return validationError(c, "Break start time must be after clock in time");
            }
            if (s.clockOut && br.end && br.end > s.clockOut) {
                return validationError(c, "Break end time must be before clock out time");
            }
        }
    }

    // work_sessions を一括挿入
    if (validSessions.length > 0) {
        const sessionInserts = validSessions.map((s) => ({
            attendance_id: attendanceId,
            clock_in: new Date(s.clockIn!).toISOString(),
            clock_out: s.clockOut ? new Date(s.clockOut).toISOString() : null,
        }));

        const { data: insertedSessions, error: wsErr } = await supabase
            .from("work_sessions")
            .insert(sessionInserts)
            .select("id");

        if (wsErr || !insertedSessions) {
            return databaseError(c, wsErr?.message || "Failed to insert sessions");
        }

        // breaks を一括挿入
        const breakInserts: { session_id: string; break_start: string; break_end: string | null }[] = [];
        for (let i = 0; i < validSessions.length; i++) {
            const sessionId = insertedSessions[i].id;
            for (const br of validSessions[i].breaks || []) {
                if (!br.start) continue;
                breakInserts.push({
                    session_id: sessionId,
                    break_start: new Date(br.start).toISOString(),
                    break_end: br.end ? new Date(br.end).toISOString() : null,
                });
            }
        }

        if (breakInserts.length > 0) {
            const { error: brErr } = await supabase.from("breaks").insert(breakInserts);
            if (brErr) {
                return databaseError(c, brErr.message);
            }
        }
    }

    return successResponse(c, null);
});

export default usersRouter;
