// backend/lib/slack.ts
// Slack通知サービス

import { Task } from '../../shared/types/Attendance';

interface SlackConfig {
    botToken: string;
    channelId: string;
}

interface SlackPostMessageResponse {
    ok: boolean;
    ts?: string;
    error?: string;
}

interface SlackMessageResult {
    success: boolean;
    ts?: string;
    error?: string;
}

/**
 * 現在時刻を HH:MM 形式で取得
 */
function getCurrentTimeString(): string {
    return new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * タスク一覧をSlack用のテキストに変換
 */
function formatTasksForSlack(tasks: Task[]): string {
    return tasks.map((t) => `• ${t.taskName}（${t.hours ?? '-'}h）`).join('\n');
}

/**
 * Slackにメッセージを送信
 */
async function postMessage(
    config: SlackConfig,
    text: string,
    userName: string,
    iconEmoji: string = ':wave:'
): Promise<SlackMessageResult> {
    try {
        const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channel: config.channelId,
                text,
                username: userName,
                icon_emoji: iconEmoji,
            }),
        });

        const result = (await response.json()) as SlackPostMessageResponse;

        if (!result.ok) {
            console.error('Slack API error:', result.error);
            return { success: false, error: result.error };
        }

        return { success: true, ts: result.ts };
    } catch (error) {
        console.error('Failed to send Slack message:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * 出勤通知を送信
 */
export async function sendClockInNotification(
    config: SlackConfig,
    userName: string,
    plannedTasks: Task[]
): Promise<SlackMessageResult> {
    const timeString = getCurrentTimeString();
    const tasksText = formatTasksForSlack(plannedTasks);

    const messageText = [
        timeString,
        `*${userName} さんが出勤しました！*`,
        '',
        '*本日の予定*',
        tasksText,
    ].join('\n');

    return postMessage(config, messageText, userName);
}

/**
 * 退勤通知を送信
 */
export async function sendClockOutNotification(
    config: SlackConfig,
    userName: string,
    actualTasks: Task[],
    options?: {
        summary?: string;
        issues?: string;
        notes?: string;
    }
): Promise<SlackMessageResult> {
    const timeString = getCurrentTimeString();
    const tasksText = formatTasksForSlack(actualTasks);

    const messageParts = [
        timeString,
        `*${userName} さんが退勤しました！*`,
        '',
        '*本日の業務*',
        tasksText,
    ];

    if (options?.summary) {
        messageParts.push('', '*まとめ*', options.summary);
    }
    if (options?.issues) {
        messageParts.push('', '*困っていること*', options.issues);
    }
    if (options?.notes) {
        messageParts.push('', '*連絡事項*', options.notes);
    }

    return postMessage(config, messageParts.join('\n'), userName);
}

/**
 * 環境変数からSlack設定を取得
 */
export function getSlackConfig(env: { SLACK_BOT_TOKEN: string; SLACK_CHANNEL_ID: string }): SlackConfig {
    return {
        botToken: env.SLACK_BOT_TOKEN,
        channelId: env.SLACK_CHANNEL_ID,
    };
}
