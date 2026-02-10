import type { Task } from "@/types/Attendance"

interface SlackConfig {
  botToken: string
  channelId: string
  clockInIconUrl?: string
  clockOutIconUrl?: string
}

interface SlackPostMessageResponse {
  ok: boolean
  ts?: string
  error?: string
}

interface SlackMessageResult {
  success: boolean
  ts?: string
  error?: string
}

function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTasksForSlack(tasks: Task[]): string {
  return tasks.map((t) => `• ${t.taskName}（${t.hours ?? "-"}h）`).join("\n")
}

async function postMessage(
  config: SlackConfig,
  text: string,
  userName: string,
  options?: {
    iconUrl?: string
    iconEmoji?: string
    threadTs?: string
  },
): Promise<SlackMessageResult> {
  try {
    const payload: Record<string, string> = {
      channel: config.channelId,
      text,
      username: userName,
    }

    if (options?.iconUrl) {
      payload.icon_url = options.iconUrl
    } else {
      payload.icon_emoji = options?.iconEmoji ?? ":wave:"
    }

    if (options?.threadTs) {
      payload.thread_ts = options.threadTs
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json()) as SlackPostMessageResponse

    if (!result.ok) {
      console.error("Slack API error:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true, ts: result.ts }
  } catch (error) {
    console.error("Failed to send Slack message:", error)
    return { success: false, error: String(error) }
  }
}

export async function sendClockInNotification(
  config: SlackConfig,
  userName: string,
  plannedTasks: Task[],
): Promise<SlackMessageResult> {
  const timeString = getCurrentTimeString()
  const tasksText = formatTasksForSlack(plannedTasks)

  const messageText = [
    timeString,
    `*${userName} さんが出勤しました！*`,
    "",
    "*本日の予定*",
    tasksText,
  ].join("\n")

  return postMessage(config, messageText, userName, {
    iconUrl: config.clockInIconUrl,
    iconEmoji: ":sunrise:",
  })
}

export async function sendClockOutNotification(
  config: SlackConfig,
  userName: string,
  actualTasks: Task[],
  options?: {
    summary?: string
    issues?: string
    notes?: string
    threadTs?: string
  },
): Promise<SlackMessageResult> {
  const timeString = getCurrentTimeString()
  const tasksText = formatTasksForSlack(actualTasks)

  const messageParts = [
    timeString,
    `*${userName} さんが退勤しました！*`,
    "",
    "*本日の業務*",
    tasksText,
  ]

  if (options?.summary) {
    messageParts.push("", "*まとめ*", options.summary)
  }
  if (options?.issues) {
    messageParts.push("", "*困っていること*", options.issues)
  }
  if (options?.notes) {
    messageParts.push("", "*連絡事項*", options.notes)
  }

  return postMessage(config, messageParts.join("\n"), userName, {
    iconUrl: config.clockOutIconUrl,
    iconEmoji: ":night_with_stars:",
    threadTs: options?.threadTs,
  })
}

export function getSlackConfig(env: {
  SLACK_BOT_TOKEN: string
  SLACK_CHANNEL_ID: string
  SLACK_ICON_CLOCK_IN?: string
  SLACK_ICON_CLOCK_OUT?: string
}): SlackConfig {
  return {
    botToken: env.SLACK_BOT_TOKEN,
    channelId: env.SLACK_CHANNEL_ID,
    clockInIconUrl: env.SLACK_ICON_CLOCK_IN,
    clockOutIconUrl: env.SLACK_ICON_CLOCK_OUT,
  }
}
