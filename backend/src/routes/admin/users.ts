// backend/src/routes/admin/users.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { formatJSTDate } from '../../../lib/time';
import { calculateDayTotals } from '../../../lib/calculation';
import { WorkSession } from '../../../../shared/types/Attendance';
import type { Database } from '../../types/supabase';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

// DB row 型
type DbRecord = Database["public"]["Tables"]["attendance_records"]["Row"] & {
    work_sessions: Array<
        Database["public"]["Tables"]["work_sessions"]["Row"] & {
            breaks: Database["public"]["Tables"]["breaks"]["Row"][];
        }
    >;
};

// DBレコードをAPIレスポンス形式に変換
function formatAttendanceRecord(record: DbRecord) {
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

    const { workTotalMs, breakTotalMs } = calculateDayTotals(record.work_sessions);

    return {
        date: record.date,
        sessions,
        workTotalMs,
        breakTotalMs,
    };
}

const usersRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// GET /admin/users - ユーザー一覧
usersRouter.get('/', async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, employee_number');

    if (error) {
        console.error(error);
        return c.json({ error: "Database error" }, 500);
    }

    const formatted = data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        employeeId: u.employee_number,
    }));

    return c.json(formatted);
});

// GET /admin/users/:userId/attendance/month - ユーザーの月次勤怠
// 統一されたAttendanceRecord[]形式で返す
usersRouter.get('/:userId/attendance/month', async (c) => {
    const userId = c.req.param('userId');
    const year = c.req.query('year');
    const month = c.req.query('month');

    if (!userId || !year || !month) {
        return c.json({ error: 'Missing parameters' }, 400);
    }

    const yearNum = Number(year);
    const monthNum = Number(month);

    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);

    const startStr = formatJSTDate(startDate);
    const endStr = formatJSTDate(endDate);

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
                breaks ( id, break_start, break_end )
            )
        `)
        .eq('user_id', userId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date');

    if (error) return c.json({ error: "Database error" }, 500);

    // 統一された形式で返す（UI用のフォーマットは含めない）
    return c.json((data as DbRecord[]).map(formatAttendanceRecord));
});

// GET /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション取得
usersRouter.get('/:userId/attendance/:date/sessions', async (c) => {
    const userId = c.req.param('userId');
    const date = c.req.param('date');

    if (!userId || !date) {
        return c.json({ error: "Missing parameters" }, 400);
    }

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
        .eq("date", date)
        .maybeSingle<DbRecord>();

    if (error) {
        console.error(error);
        return c.json({ error: "DB error" }, 500);
    }

    if (!data?.work_sessions || !Array.isArray(data.work_sessions)) {
        return c.json([], 200);
    }

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

    return c.json(sessions, 200);
});

// PUT /admin/users/:userId/attendance/:date/sessions - ユーザーの特定日のセッション更新
usersRouter.put('/:userId/attendance/:date/sessions', async (c) => {
    const userId = c.req.param('userId');
    const date = c.req.param('date');
    const { sessions }: { sessions: WorkSession[] } = await c.req.json();

    if (!userId || !date || !sessions) {
        return c.json({ error: "Missing parameters" }, 400);
    }

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
            return c.json({ error: "Failed to create attendance" }, 500);
        }

        attendanceId = newRecord.id;
    }

    // 新しい work_sessions を登録
    for (const s of sessions) {
        if (!s.clockIn) continue;

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
            return c.json({ error: "Failed to insert session" }, 500);
        }

        for (const br of s.breaks) {
            if (!br.start) continue;

            const { error: brErr } = await supabase.from("breaks").insert({
                session_id: ws.id,
                break_start: new Date(br.start).toISOString(),
                break_end: br.end ? new Date(br.end).toISOString() : null,
            });

            if (brErr) {
                return c.json({ error: "Failed to insert break" }, 500);
            }
        }
    }

    return c.json({ ok: true });
});

export default usersRouter;
