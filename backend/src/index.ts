// backend/src/index.ts
import { Hono } from 'hono'
import reportRoute from './routes/report'
import attendanceRoute from './routes/attendance'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.route('/report', reportRoute)
app.route('/attendance', attendanceRoute)

export default app