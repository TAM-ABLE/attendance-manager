// backend/src/routes/day.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import { todayJSTString } from '../../lib/time';
import type { Database } from '../types/supabase';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';

// 型安全なネスト付きレコード型
type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

const dayRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

dayRouter.get('/', async (c) => {
    const { id: userId } = c.get('jwtPayload');
    const date = todayJSTString(); //"2025-11-23"

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
        .maybeSingle<DbAttendanceRecord>(); // ← 結果型を指定

    if (!data) return c.json(null);

    const formatted = {
        id: data.id,
        date: data.date,
        sessions: data.work_sessions.map((s) => ({
            id: s.id,
            clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
            clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
            breaks: s.breaks.map((b) => ({
                id: b.id,
                start: b.break_start ? new Date(b.break_start).getTime() : null,
                end: b.break_end ? new Date(b.break_end).getTime() : null,
            })),
        })),
    };

    return c.json(formatted);
});

export default dayRouter;
