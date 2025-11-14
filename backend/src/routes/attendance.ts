import { Hono } from 'hono'
import { cors } from 'hono/cors' // ← 追加
import { sendAttendanceNotification } from '../services/attendanceService'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

// すべてのリクエストに CORS を適用
app.use('*', cors({
    origin: '*', // 開発中は * でOK。本番では 'http://localhost:3000' などに制限すると良い
    allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

// POST /attendance/
app.post('/', async (c) => {
    const { name, action } = await c.req.json() // { name: string, action: 'clockIn' | 'clockOut' | 'breakStart' | 'breakEnd' }

    const env = {
        SLACK_WEBHOOK_URL:
            c.env?.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL!,
    }

    const message = await sendAttendanceNotification(name, action, env)
    return c.json({ success: true, message })
})

// OPTIONS /attendance/ にも対応（CORSのプリフライト用）
app.options('/', (c) => c.json({ ok: true }))

export default app