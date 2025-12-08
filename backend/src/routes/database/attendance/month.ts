// backend/src/routes/database/attendance/month.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../../lib/supabase';
import type { Database } from '../../../types/supabase';
import { verify } from 'hono/jwt';
import { Env } from '../../../types/env';

// attendance_records + work_sessions + breaks の型
type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

const attendanceMonthRouter = new Hono<{ Bindings: Env }>();

attendanceMonthRouter.get('/', async (c) => {
    // -------------------------
    // 認証
    // -------------------------
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];

    if (!c.env.JWT_SECRET) {
        console.error("JWT_SECRET missing");
        return c.json({ error: "Server configuration error" }, 500);
    }

    let payload: { id: string; role: "admin" | "user" };
    try {
        payload = await verify(token, c.env.JWT_SECRET) as { id: string; role: "admin" | "user" };
    } catch {
        return c.json({ error: "Invalid token" }, 401);
    }

    const userId = payload.id;

    // -------------------------
    // クエリパラメータ取得
    // -------------------------
    const year = c.req.query("year");
    const month = c.req.query("month");

    if (!year || !month) {
        return c.json({ error: "Missing parameters" }, 400);
    }

    // YYYY-MM の範囲に一致させる
    const start = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = new Date(Number(year), Number(month), 0).getDate(); // 月末日
    const end = `${year}-${month.padStart(2, "0")}-${endDate}`;

    const supabase = getSupabaseClient(c.env);

    // -------------------------
    // Supabase から月次データ取得
    // -------------------------
    const { data, error } = await supabase
        .from("attendance_records")
        .select(`
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
        `)
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .returns<DbAttendanceRecord[]>();

    if (error) {
        console.error(error);
        return c.json({ error: "Database error" }, 500);
    }


    const formatted = data.map((d) => ({
        id: d.id,
        date: d.date,
        sessions: d.work_sessions.map((s) => ({
            id: s.id,
            clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
            clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
            breaks: s.breaks.map((b) => ({
                id: b.id,
                start: b.break_start ? new Date(b.break_start).getTime() : null,
                end: b.break_end ? new Date(b.break_end).getTime() : null,
            })),
        })),
    }));

    return c.json(formatted);
});

export default attendanceMonthRouter;