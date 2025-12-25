// backend/src/routes/attendance/queries.ts
import { Hono } from "hono";
import { getSupabaseClient } from "../../../lib/supabase";
import { todayJSTString, parseYearMonth } from "../../../lib/time";
import { formatAttendanceRecord, DbAttendanceRecord } from "../../../lib/formatters";
import { calculateDayTotals } from "../../../lib/calculation";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { successResponse, databaseError, validationError } from "../../../lib/errors";
import { validateParams } from "../../middleware/validation";
import { yearMonthParamsSchema, type YearMonthParams } from "../../../lib/schemas";

const queriesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// GET /attendance/today
queriesRouter.get("/today", async (c) => {
    const { id: userId } = c.get("jwtPayload");
    const date = todayJSTString();

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

    if (!data) {
        return successResponse(c, null);
    }

    return successResponse(c, formatAttendanceRecord(data));
});

// GET /attendance/month/:yearMonth
queriesRouter.get("/month/:yearMonth", validateParams(yearMonthParamsSchema), async (c) => {
    const { id: userId } = c.get("jwtPayload");
    const { yearMonth } = c.get("validatedParams") as YearMonthParams;

    const parsed = parseYearMonth(yearMonth);
    if (!parsed) {
        return validationError(c, "Invalid year-month format");
    }
    const { year, month } = parsed;

    // 月の開始日と終了日を計算
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
                breaks (
                    id,
                    break_start,
                    break_end
                )
            )
        `
        )
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .returns<DbAttendanceRecord[]>();

    if (error) {
        return databaseError(c, error.message);
    }

    return successResponse(c, data.map(formatAttendanceRecord));
});

// GET /attendance/week/total
queriesRouter.get("/week/total", async (c) => {
    const { id: userId } = c.get("jwtPayload");

    // 今週の月曜日と日曜日を計算
    const date = new Date();
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().split("T")[0];
    const endDate = sunday.toISOString().split("T")[0];

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
        .gte("date", startDate)
        .lte("date", endDate);

    if (error) {
        return databaseError(c, error.message);
    }

    const dbRecords = data as DbAttendanceRecord[];

    let netWorkMs = 0;
    for (const rec of dbRecords) {
        const { workTotalMs } = calculateDayTotals(rec.work_sessions);
        netWorkMs += workTotalMs;
    }

    return successResponse(c, { netWorkMs });
});

export default queriesRouter;
