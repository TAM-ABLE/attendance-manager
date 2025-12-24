// backend/src/routes/attendance/breaks.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { todayJSTString } from '../../../lib/time';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

const breaksRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// POST /attendance/breaks/start
breaksRouter.post('/start', async (c) => {
    const { id: userId } = c.get('jwtPayload');
    const supabase = getSupabaseClient(c.env);

    const date = todayJSTString();

    // 1. 今日の attendance_record を取得
    const { data: record, error: recordErr } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

    if (recordErr) return c.json({ error: recordErr.message }, 500);
    if (!record) return c.json({ error: 'No attendance for today' }, 400);

    const attendanceId = record.id;

    // 2. clock_out が null の最新 session を取得
    const { data: session, error: sessionErr } = await supabase
        .from('work_sessions')
        .select('id')
        .eq('attendance_id', attendanceId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (sessionErr) return c.json({ error: sessionErr.message }, 500);
    if (!session) return c.json({ error: 'No active session' }, 400);

    const sessionId = session.id;

    // 3. この session で「未終了 break」 が無いか確認
    const { data: activeBreak, error: breakErr } = await supabase
        .from('breaks')
        .select('id')
        .eq('session_id', sessionId)
        .is('break_end', null)
        .maybeSingle();

    if (breakErr) return c.json({ error: breakErr.message }, 500);
    if (activeBreak) return c.json({ error: 'Break already in progress' }, 400);

    // 4. break_start レコードを作成
    const { error: insertErr } = await supabase
        .from('breaks')
        .insert({
            session_id: sessionId,
            break_start: new Date().toISOString(),
        });

    if (insertErr) return c.json({ error: insertErr.message }, 500);

    return c.json({ success: true });
});

// POST /attendance/breaks/end
breaksRouter.post('/end', async (c) => {
    const { id: userId } = c.get('jwtPayload');
    const supabase = getSupabaseClient(c.env);

    const date = todayJSTString();

    // 1. 今日の attendance_record を取得
    const { data: record, error: recordErr } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
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

export default breaksRouter;
