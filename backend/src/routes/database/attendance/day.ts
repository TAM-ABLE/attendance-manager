// backend/src/routes/database/attendance/day.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { toJST } from '../../../lib/time';
import type { Database } from '../../../types/supabase';
import { verify } from 'hono/jwt';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

// 型安全なネスト付きレコード型
type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

const attendanceDayRouter = new Hono<{ Bindings: Env }>();

attendanceDayRouter.get('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    console.log('Hono JWT_SECRET:', c.env.JWT_SECRET);
    console.log('Received token:', token);

    let payload: { id: string; role: 'admin' | 'user' };

    try {
        // JWT_SECRET が未定義なら、検証に進む前にエラーを出す
        if (!c.env.JWT_SECRET || c.env.JWT_SECRET.length === 0) {
            console.error('JWT_SECRET is missing in Hono environment.');
            return c.json({ error: 'Server configuration error: JWT Secret missing' }, 500);
        }

        // 検証実行
        payload = await verify(token, c.env.JWT_SECRET) as { id: string; role: 'admin' | 'user' };

    } catch (e) {
        // 実際の検証失敗（期限切れ、署名不一致など）はこちらで捕捉
        console.error('JWT Verification failed:', String(e));
        return c.json({ error: 'Invalid token' }, 401); // 期待通りの 401 を返す
    }
    // --- 検証終了 ---

    const userId = payload.id;
    const date = new Date().toISOString().split("T")[0]; //"2025-11-23"

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
            clockIn: toJST(s.clock_in),
            clockOut: s.clock_out ? toJST(s.clock_out) : null,
            breaks: s.breaks.map((b) => ({
                id: b.id,
                start: toJST(b.break_start),
                end: b.break_end ? toJST(b.break_end) : null,
            })),
        })),
    };

    return c.json(formatted);
});

export default attendanceDayRouter;