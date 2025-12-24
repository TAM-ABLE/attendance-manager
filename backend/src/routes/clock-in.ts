// backend/src/routes/clock-in.ts
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

const clockInRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

clockInRouter.post('/', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    // body の取得
    const { userName, plannedTasks } = await c.req.json() as {
        userName: string;
        plannedTasks: Task[];
    };

    // ========================================
    // 1. DBに出勤データを保存
    // ========================================
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 今日の attendance_record が存在するか確認
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

    // 新しい work_session を clock_in = now() で作成
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

    // ========================================
    // 2. 日報を作成し、予定タスクを保存
    // ========================================
    const { data: dailyReport, error: reportErr } = await supabase
        .from('daily_reports')
        .insert({
            user_id: userId,
            date: date,
        })
        .select('id')
        .single();

    if (reportErr) {
        console.error(reportErr);
        return c.json({ error: reportErr.message }, 500);
    }

    // 予定タスクを保存
    if (plannedTasks.length > 0) {
        const taskInserts = plannedTasks.map((task, index) => ({
            daily_report_id: dailyReport.id,
            task_type: 'planned',
            task_name: task.task,
            hours: task.hours ? parseFloat(task.hours) : null,
            sort_order: index,
        }));

        const { error: tasksErr } = await supabase
            .from('daily_report_tasks')
            .insert(taskInserts);

        if (tasksErr) {
            console.error(tasksErr);
            // タスク保存失敗しても出勤は成功とする
        }
    }

    // ========================================
    // 3. Slack に通知を送信
    // ========================================
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const tasksText = plannedTasks
        .map((t) => `• ${t.task}（${t.hours}）`)
        .join('\n');

    const messageText = `${timeString}\n*${userName} さんが出勤しました！*\n\n*本日の予定*\n${tasksText}`;

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
        // Slack通知は失敗しても出勤自体は成功とする（ログに残す）
        console.error('Failed to send Slack message:', slackRes);
    }

    return c.json({ success: true, slack_ts: slackRes.ts });
});

export default clockInRouter;
