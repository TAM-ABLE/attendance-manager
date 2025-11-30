// backend/src/routes/database/attendance/clock-out.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../../lib/supabase';
import { verify } from 'hono/jwt';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceClockOutRouter = new Hono<{ Bindings: Env }>();

attendanceClockOutRouter.post('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    // JWT 認証
    let payload: { id: string; role: 'admin' | 'user' };
    try {
        payload = await verify(token, c.env.JWT_SECRET) as {
            id: string;
            role: 'admin' | 'user';
        };
    } catch {
        return c.json({ error: 'Invalid token' }, 401);
    }

    const userId = payload.id;
    const supabase = getSupabaseClient(c.env);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // 1. 今日の attendance_record を取得
    const { data: record, error: recordErr } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .maybeSingle();

    if (recordErr) {
        console.error(recordErr);
        return c.json({ error: recordErr.message }, 500);
    }

    if (!record) {
        return c.json({ error: 'No attendance record for today' }, 400);
    }

    const attendanceId = record.id;

    // 2. clock_out が null の「最新の」work_session を取得
    const { data: session, error: sessionErr } = await supabase
        .from('work_sessions')
        .select('id')
        .eq('attendance_id', attendanceId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (sessionErr) {
        console.error(sessionErr);
        return c.json({ error: sessionErr.message }, 500);
    }

    if (!session) {
        return c.json({ error: 'No active session to clock out' }, 400);
    }

    // 3. clock_out を埋める
    const { error: updateErr } = await supabase
        .from('work_sessions')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', session.id);

    if (updateErr) {
        console.error(updateErr);
        return c.json({ error: updateErr.message }, 500);
    }

    return c.json({ success: true });
});

export default attendanceClockOutRouter;