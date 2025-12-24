// backend/src/routes/attendance/clock.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import { todayJSTString } from '../../../lib/time';
import { Task } from '../../../../shared/types/Attendance';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

interface SlackPostMessageResponse {
    ok: boolean;
    ts?: string;
    error?: string;
}

const clockRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// POST /attendance/clock-in
clockRouter.post('/clock-in', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    const { userName, plannedTasks } = await c.req.json() as {
        userName: string;
        plannedTasks: Task[];
    };

    // 1. DBに出勤データを保存
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

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

    // 2. 日報を作成し、予定タスクを保存
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
        }
    }

    // 3. Slack に通知を送信
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
        console.error('Failed to send Slack message:', slackRes);
    }

    return c.json({ success: true, slack_ts: slackRes.ts });
});

// POST /attendance/clock-out
clockRouter.post('/clock-out', async (c) => {
    const { id: userId } = c.get('jwtPayload');

    const { userName, actualTasks, summary, issues, notes } = await c.req.json() as {
        userName: string;
        actualTasks: Task[];
        summary?: string;
        issues?: string;
        notes?: string;
    };

    // 1. DBに退勤データを保存
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

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

    const { error: updateErr } = await supabase
        .from('work_sessions')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', session.id);

    if (updateErr) {
        console.error(updateErr);
        return c.json({ error: updateErr.message }, 500);
    }

    // 2. 日報を更新し、実績タスクを保存
    const { data: dailyReport, error: reportFetchErr } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .is('submitted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (reportFetchErr) {
        console.error(reportFetchErr);
    }

    if (dailyReport) {
        const { error: reportUpdateErr } = await supabase
            .from('daily_reports')
            .update({
                summary: summary || null,
                issues: issues || null,
                notes: notes || null,
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', dailyReport.id);

        if (reportUpdateErr) {
            console.error(reportUpdateErr);
        }

        if (actualTasks.length > 0) {
            const taskInserts = actualTasks.map((task, index) => ({
                daily_report_id: dailyReport.id,
                task_type: 'actual',
                task_name: task.task,
                hours: task.hours ? parseFloat(task.hours) : null,
                sort_order: index,
            }));

            const { error: tasksErr } = await supabase
                .from('daily_report_tasks')
                .insert(taskInserts);

            if (tasksErr) {
                console.error(tasksErr);
            }
        }
    }

    // 3. Slack に通知を送信
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
        console.error('Failed to send Slack message:', slackRes);
    }

    return c.json({ success: true, slack_ts: slackRes.ts });
});

export default clockRouter;
