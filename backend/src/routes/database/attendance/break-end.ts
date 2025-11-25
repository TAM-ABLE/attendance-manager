// backend/src/routes/database/attendance/break-end.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { verify } from 'hono/jwt';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceBreakEndRouter = new Hono<{ Bindings: Env }>();

attendanceBreakEndRouter.post('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    // JWT 検証
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

    // 2. active session（clock_out が null）の最新 1つ取得
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
        return c.json({ error: 'No active session' }, 400);
    }

    const sessionId = session.id;

    // 3. break_end が null の「現在の break」を取得
    const { data: activeBreak, error: breakErr } = await supabase
        .from('breaks')
        .select('id')
        .eq('session_id', sessionId)
        .is('break_end', null)
        .order('break_start', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (breakErr) {
        console.error(breakErr);
        return c.json({ error: breakErr.message }, 500);
    }

    if (!activeBreak) {
        return c.json({ error: 'No active break to end' }, 400);
    }

    // 4. break_end を埋める
    const { error: updateErr } = await supabase
        .from('breaks')
        .update({
            break_end: new Date().toISOString(),
        })
        .eq('id', activeBreak.id);

    if (updateErr) {
        console.error(updateErr);
        return c.json({ error: updateErr.message }, 500);
    }

    return c.json({ success: true });
});

export default attendanceBreakEndRouter;