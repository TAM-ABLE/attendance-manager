// backend/src/routes/attendance/queries.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { todayJSTString } from '../../../lib/time';
import { calculateDayTotals } from '../../../lib/calculation';
import type { Database } from '../../types/supabase';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

// 型安全なネスト付きレコード型
type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

// DBレコードをAPIレスポンス形式に変換
function formatAttendanceRecord(record: DbAttendanceRecord) {
    const sessions = record.work_sessions.map((s) => ({
        id: s.id,
        clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
        clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
        breaks: s.breaks.map((b) => ({
            id: b.id,
            start: b.break_start ? new Date(b.break_start).getTime() : null,
            end: b.break_end ? new Date(b.break_end).getTime() : null,
        })),
    }));

    // バックエンドで計算
    const { workTotalMs, breakTotalMs } = calculateDayTotals(record.work_sessions);

    return {
        date: record.date,
        sessions,
        workTotalMs,
        breakTotalMs,
    };
}

const queriesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// GET /attendance/today
queriesRouter.get('/today', async (c) => {
    const { id: userId } = c.get('jwtPayload');
    const date = todayJSTString();

    const supabase = getSupabaseClient(c.env);

    const { data } = await supabase
        .from('attendance_records')
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
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle<DbAttendanceRecord>();

    if (!data) return c.json(null);

    return c.json(formatAttendanceRecord(data));
});

// GET /attendance/month
queriesRouter.get('/month', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    const year = c.req.query("year");
    const month = c.req.query("month");

    if (!year || !month) {
        return c.json({ error: "Missing parameters" }, 400);
    }

    const start = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${month.padStart(2, "0")}-${endDate}`;

    const supabase = getSupabaseClient(c.env);

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

    return c.json(data.map(formatAttendanceRecord));
});

// GET /attendance/week/total
queriesRouter.get('/week/total', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    const date = new Date();
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from('attendance_records')
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
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error(error);
        return c.json({ error: error.message }, 500);
    }

    const dbRecords = data as DbAttendanceRecord[];

    let netWorkMs = 0;
    for (const rec of dbRecords) {
        const { workTotalMs } = calculateDayTotals(rec.work_sessions);
        netWorkMs += workTotalMs;
    }

    return c.json({ netWorkMs });
});

export default queriesRouter;
