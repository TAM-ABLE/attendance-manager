// backend/src/routes/database/attendance/month.ts
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getSupabaseClient } from '../../../../lib/supabase';
import { DayAttendance } from '../../../../../shared/types/Attendance';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceUserMonthRouter = new Hono<{ Bindings: Env }>();

attendanceUserMonthRouter.get('/', async (c) => {
    // --- JWT 認証 ---
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let payload: { id: string; role: 'admin' | 'user' };

    try {
        payload = await verify(token, c.env.JWT_SECRET) as {
            id: string;
            role: 'admin' | 'user';
        };
    } catch {
        return c.json({ error: 'Invalid token' }, 401);
    }

    // --- 管理者のみ ---
    if (payload.role !== 'admin') {
        return c.json({ error: 'Forbidden (admin only)' }, 403);
    }

    // --- クエリ取得 ---
    const userId = c.req.query('userId');
    const year = c.req.query('year');
    const month = c.req.query('month');

    if (!userId || !year || !month) {
        return c.json({ error: 'Missing parameters' }, 400);
    }

    const yearNum = Number(year);
    const monthNum = Number(month);

    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // --- Supabase ---
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

    // --- 日本語曜日 ---
    const jpWeekday = ["日", "月", "火", "水", "木", "金", "土"];

    const result: DayAttendance[] = [];
    const daysInMonth = endDate.getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const objDate = new Date(yearNum, monthNum, d);

        const dateStr = objDate.toISOString().split("T")[0];
        const weekday = jpWeekday[objDate.getDay()];
        const dateLabel = `${monthNum + 1}月${d}日`;

        const record = data.find((r) => r.date === dateStr);

        if (!record) {
            result.push({
                day: weekday,
                date: dateLabel,
                hasData: false,
                session1ClockIn: null,
                session1ClockOut: null,
                session2ClockIn: null,
                session2ClockOut: null,
                session3ClockIn: null,
                session3ClockOut: null,
                workTotalHours: 0,
                breakTotalHours: 0,
            });
            continue;
        }

        const sessions = record.work_sessions;

        let workTotal = 0;
        let breakTotal = 0;

        const clockFields: Record<string, number | null> = {
            session1ClockIn: null,
            session1ClockOut: null,
            session2ClockIn: null,
            session2ClockOut: null,
            session3ClockIn: null,
            session3ClockOut: null,
        };

        sessions.forEach((s, index) => {
            if (index > 2) return;

            const ci = s.clock_in ? new Date(s.clock_in).getTime() : null;
            const co = s.clock_out ? new Date(s.clock_out).getTime() : null;

            clockFields[`session${index + 1}ClockIn`] = ci;
            clockFields[`session${index + 1}ClockOut`] = co;

            // --- 勤務時間 & 休憩時間 ---
            if (ci && co) {
                // 休憩時間計算
                let sessionBreak = 0;

                s.breaks?.forEach((b) => {
                    if (b.break_start && b.break_end) {
                        const bs = new Date(b.break_start).getTime();
                        const be = new Date(b.break_end).getTime();
                        sessionBreak += (be - bs);
                    }
                });

                // 勤務時間計算
                const sessionWork = (co - ci) - sessionBreak;

                workTotal += sessionWork;
                breakTotal += sessionBreak;
            }
        });

        result.push({
            day: weekday,
            date: dateLabel,
            hasData: true,
            ...clockFields,
            workTotalHours: workTotal,
            breakTotalHours: breakTotal,
        });
    }

    return c.json(result);
});

export default attendanceUserMonthRouter;