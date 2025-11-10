//backend/src/routes/report.ts

import { Hono } from 'hono'
import { sendReportToSlack } from '../services/reportService'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.post('/', async (c) => {
    const body = await c.req.json()

    const env = {
        SLACK_WEBHOOK_URL:
            c.env?.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL!,
    }

    await sendReportToSlack(body, env)
    return c.json({ success: true })
})

export default app