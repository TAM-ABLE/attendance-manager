// backend/src/routes/week-total-hours.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import type { Database } from '../types/supabase';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';

type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

const weekTotalHoursRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

weekTotalHoursRouter.get('/', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    // 今日の日付
    const date = new Date();

    // 今日の週の月〜日を算出
    const dayOfWeek = date.getDay(); // 0(日)〜6(土)
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
        for (const ws of rec.work_sessions ?? []) {
            const clockIn = ws.clock_in ? new Date(ws.clock_in).getTime() : null;
            const clockOut = ws.clock_out ? new Date(ws.clock_out).getTime() : null;

            if (clockIn && clockOut) {
                let sessionWork = clockOut - clockIn;

                // 休憩時間を差し引く
                for (const br of ws.breaks ?? []) {
                    const start = br.break_start ? new Date(br.break_start).getTime() : null;
                    const end = br.break_end ? new Date(br.break_end).getTime() : null;

                    if (start && end) {
                        sessionWork -= (end - start);
                    }
                }

                netWorkMs += sessionWork;
            }
        }
    }

    return c.json({ netWorkMs });
});

export default weekTotalHoursRouter;
