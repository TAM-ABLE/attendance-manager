// backend/src/routes/admin/users.ts
import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseClient } from "../../../lib/supabase";
import { parseYearMonth } from "../../../lib/time";
import { formatAttendanceRecord, DbAttendanceRecord } from "../../../lib/formatters";
import { WorkSession, Break } from "../../../../shared/types/Attendance";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { successResponse, databaseError, validationError } from "../../../lib/errors";
import { validateParams, validateBody } from "../../middleware/validation";
import {
    dateSchema,
    uuidSchema,
    yearMonthParamsSchema,
    updateSessionsRequestSchema,
    type UpdateSessionsRequest,
} from "../../../lib/schemas";

const usersRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// パラメータスキーマ
const userDateParamsSchema = z.object({
    userId: uuidSchema,
    date: dateSchema,
});

const userYearMonthParamsSchema = z.object({
    userId: uuidSchema,
    yearMonth: yearMonthParamsSchema.shape.yearMonth,
});

// GET /admin/users - ユーザー一覧
usersRouter.get("/", async (c) => {
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
        employeeId: u.employee_number,
    }));

    return successResponse(c, { users });
});

// GET /admin/users/:userId/attendance/month/:yearMonth - ユーザーの月次勤怠
usersRouter.get("/:userId/attendance/month/:yearMonth", validateParams(userYearMonthParamsSchema), async (c) => {
    const { userId, yearMonth } = c.get("validatedParams") as { userId: string; yearMonth: string };

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
usersRouter.get("/:userId/attendance/:date/sessions", validateParams(userDateParamsSchema), async (c) => {
    const { userId, date } = c.get("validatedParams") as { userId: string; date: string };

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

    const sessions: WorkSession[] = data.work_sessions.map((s) => ({
        id: s.id,
        clockIn: s.clock_in ? new Date(s.clock_in).getTime() : undefined,
        clockOut: s.clock_out ? new Date(s.clock_out).getTime() : undefined,
        breaks: s.breaks.map(
            (b): Break => ({
                id: b.id,
                start: b.break_start ? new Date(b.break_start).getTime() : undefined,
                end: b.break_end ? new Date(b.break_end).getTime() : undefined,
            })
        ),
    }));

    return successResponse(c, sessions);
});

// PUT /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション更新
usersRouter.put(
    "/:userId/attendance/:date/sessions",
    validateParams(userDateParamsSchema),
    validateBody(updateSessionsRequestSchema),
    async (c) => {
        const { userId, date } = c.get("validatedParams") as { userId: string; date: string };
        const { sessions } = c.get("validatedBody") as UpdateSessionsRequest;

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

        // 新しい work_sessions を登録
        for (const s of sessions) {
            if (!s.clockIn) continue;

            // clockIn と clockOut のバリデーション
            if (s.clockOut && s.clockOut < s.clockIn) {
                return validationError(c, "Clock out time must be after clock in time");
            }

            const { data: ws, error: wsErr } = await supabase
                .from("work_sessions")
                .insert({
                    attendance_id: attendanceId,
                    clock_in: new Date(s.clockIn).toISOString(),
                    clock_out: s.clockOut ? new Date(s.clockOut).toISOString() : null,
                })
                .select()
                .single();

            if (wsErr || !ws) {
                return databaseError(c, wsErr?.message || "Failed to insert session");
            }

            for (const br of s.breaks || []) {
                if (!br.start) continue;

                // break の時刻バリデーション
                if (br.end && br.end < br.start) {
                    return validationError(c, "Break end time must be after break start time");
                }

                const { error: brErr } = await supabase.from("breaks").insert({
                    session_id: ws.id,
                    break_start: new Date(br.start).toISOString(),
                    break_end: br.end ? new Date(br.end).toISOString() : null,
                });

                if (brErr) {
                    return databaseError(c, brErr.message);
                }
            }
        }

        return successResponse(c, null);
    }
);

export default usersRouter;
