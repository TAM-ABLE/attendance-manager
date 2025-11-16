import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sendSlackNotification } from '../services/slackService'
import { formatTime } from '../utils/formatTime'
import {
    ClockInPayload,
    ClockOutPayload,
    TaskItem
} from '../types/slack'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.use('*', cors())

// -----------------------------
// 出勤（clock-in）
// -----------------------------
app.post('/clock-in', async (c) => {
    const payload: ClockInPayload = await c.req.json()
    const { name, plannedTasks } = payload
    const time = formatTime(new Date())

    const tasksText = plannedTasks
        .map((t: TaskItem) => `・${t.task}（${t.hours}）`)
        .join('\n')

    const message = `
${time} に ${name} さんが出勤しました！

実施予定タスク（予定工数）
${tasksText}
`.trim()

    await sendSlackNotification(message, c.env)
    return c.json({ success: true })
})


// -----------------------------
// 退勤（clock-out）
// -----------------------------
app.post('/clock-out', async (c) => {
    const payload: ClockOutPayload = await c.req.json()
    const { name, actualTasks, summary, issues, notes } = payload
    const time = formatTime(new Date())

    const tasksText = actualTasks
        .map((t: TaskItem) => `・${t.task}（${t.hours}）`)
        .join('\n')

    const message = `
${time} に ${name} さんが退勤しました！

実施タスク（実工数）
${tasksText}

本日のまとめ
${summary || '（未入力）'}

困ってること
${issues || ' なし '}

連絡事項
${notes || ' なし '}
`.trim()

    await sendSlackNotification(message, c.env)
    return c.json({ success: true })
})


// -----------------------------
// 休憩開始（break-start）
// -----------------------------
app.post('/break-start', async (c) => {
    const { name } = await c.req.json()
    const time = formatTime(new Date())

    const message = `
${time} に ${name} さんが休憩を開始しました！
`.trim()

    await sendSlackNotification(message, c.env)
    return c.json({ success: true })
})


// -----------------------------
// 休憩終了（break-end）
// -----------------------------
app.post('/break-end', async (c) => {
    const { name } = await c.req.json()
    const time = formatTime(new Date())

    const message = `
${time} に ${name} さんが休憩を終了しました！
`.trim()

    await sendSlackNotification(message, c.env)
    return c.json({ success: true })
})

export default app