// backend/src/routes/slack/clock-in-report.ts

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

const slackClockInReport = new Hono<{ Bindings: Env }>();

slackClockInReport.post("/", async (c) => {

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
    const { userName, plannedTasks } = await c.req.json() as {
        userName: string;
        plannedTasks: Task[];
    };

    // メッセージ構築
    const now = new Date();
    const timeString = now.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const tasksText = plannedTasks
        .map((t) => `• ${t.task}（${t.hours}）`)
        .join("\n");

    const messageText =
        `${timeString}\n*${userName} さんが出勤しました！*\n\n*本日の予定*\n${tasksText}`;


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

export default slackClockInReport;
