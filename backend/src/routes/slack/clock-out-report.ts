import { Hono } from "hono";
import { verify } from "hono/jwt";

type Env = {
    SLACK_BOT_TOKEN: string;
    SLACK_CHANNEL_ID: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

interface Task {
    task: string;
    hours: string;
}

interface SlackPostMessageResponse {
    ok: boolean;
    ts?: string;
    error?: string;
}

const slackClockOutReport = new Hono<{ Bindings: Env }>();

slackClockOutReport.post("/", async (c) => {
    // 認証
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];

    let payload: { id: string; role: "admin" | "user" };

    try {
        payload = await verify(token, c.env.JWT_SECRET) as { id: string; role: "admin" | "user" };
    } catch {
        return c.json({ error: "Invalid token" }, 401);
    }

    const userId: string = payload.id;
    console.log(userId);

    // body の取得
    const { userName, actualTasks, summary, issues, notes } = await c.req.json() as {
        userName: string;
        actualTasks: Task[];
        summary?: string;
        issues?: string;
        notes?: string;
    };

    // メッセージ構築
    const now = new Date();
    const timeString = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

    const tasksText = actualTasks.map(t => `• ${t.task}（${t.hours}）`).join("\n");

    let messageText = `${timeString}\n*${userName} さんが退勤しました！*\n\n*本日の業務*\n${tasksText}`;

    if (summary) messageText += `\n\n*まとめ*\n${summary}`;
    if (issues) messageText += `\n\n*困っていること*\n${issues}`;
    if (notes) messageText += `\n\n*連絡事項*\n${notes}`;

    // 任意でアイコンを変える例
    const iconEmoji = ":wave:"; // ここをユーザーごとに変えられる

    // Slack POST
    const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${c.env.SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channel: c.env.SLACK_CHANNEL_ID,
            text: messageText,
            username: userName,
            icon_emoji: iconEmoji,
        })
    });

    const slackRes = (await response.json()) as SlackPostMessageResponse;
    console.log(slackRes);
    console.log("Posting to channel:", c.env.SLACK_CHANNEL_ID);

    if (!slackRes.ok) {
        return c.json({ error: "Failed to send Slack message", detail: slackRes }, 500);
    }

    return c.json({ ok: true, slack_ts: slackRes.ts });
});

export default slackClockOutReport;
