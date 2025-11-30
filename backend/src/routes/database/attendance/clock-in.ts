// backend/src/routes/database/attendance/clock-in.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../../lib/supabase';
import { verify } from 'hono/jwt';
import { todayJSTString } from '../../../../lib/time';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceClockInRouter = new Hono<{ Bindings: Env }>();

attendanceClockInRouter.post('/', async (c) => {
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

    const date = todayJSTString();

    // 1. 今日の attendance_record が存在するか確認
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

    let attendanceId = record?.id;

    // 無ければ作る
    if (!attendanceId) {
        const { data: newRecord, error: newRecordErr } = await supabase
            .from('attendance_records')
            .insert({
                user_id: userId,
                date: date,
            })
            .select('id')
            .single();

        if (newRecordErr) {
            console.error(newRecordErr);
            return c.json({ error: newRecordErr.message }, 500);
        }

        attendanceId = newRecord.id;
    }

    // 2. 新しい work_session を clock_in = now() で作成
    const { error: sessionErr } = await supabase
        .from('work_sessions')
        .insert({
            attendance_id: attendanceId,
            clock_in: new Date().toISOString(),
        });

    if (sessionErr) {
        console.error(sessionErr);
        return c.json({ error: sessionErr.message }, 500);
    }

    return c.json({ success: true });
});

export default attendanceClockInRouter;