// backend/src/routes/clock-out.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import { todayJSTString } from '../../lib/time';
import { Task } from '../../../shared/types/Attendance';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';

interface SlackPostMessageResponse {
    ok: boolean;
    ts?: string;
    error?: string;
}

const clockOutRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

clockOutRouter.post('/', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    // body の取得
    const { userName, actualTasks, summary, issues, notes } = await c.req.json() as {
        userName: string;
        actualTasks: Task[];
        summary?: string;
        issues?: string;
        notes?: string;
    };

    // ========================================
    // 1. DBに退勤データを保存
    // ========================================
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 今日の attendance_record を取得
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

    // clock_out が null の「最新の」work_session を取得
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

    // clock_out を埋める
    const { error: updateErr } = await supabase
        .from('work_sessions')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', session.id);

    if (updateErr) {
        console.error(updateErr);
        return c.json({ error: updateErr.message }, 500);
    }

    // ========================================
    // 2. Slack に通知を送信
    // ========================================
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const tasksText = actualTasks.map((t) => `• ${t.task}（${t.hours}）`).join('\n');

    let messageText = `${timeString}\n*${userName} さんが退勤しました！*\n\n*本日の業務*\n${tasksText}`;

    if (summary) messageText += `\n\n*まとめ*\n${summary}`;
    if (issues) messageText += `\n\n*困っていること*\n${issues}`;
    if (notes) messageText += `\n\n*連絡事項*\n${notes}`;

    const iconEmoji = ':wave:';

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${c.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            channel: c.env.SLACK_CHANNEL_ID,
            text: messageText,
            username: userName,
            icon_emoji: iconEmoji,
        }),
    });

    const slackRes = (await response.json()) as SlackPostMessageResponse;
    console.log(slackRes);
    console.log('Posting to channel:', c.env.SLACK_CHANNEL_ID);

    if (!slackRes.ok) {
        // Slack通知は失敗しても退勤自体は成功とする（ログに残す）
        console.error('Failed to send Slack message:', slackRes);
    }

    return c.json({ success: true, slack_ts: slackRes.ts });
});

export default clockOutRouter;
