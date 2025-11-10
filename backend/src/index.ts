// backend/src/index.ts
import { Hono } from 'hono'
import reportRoute from './routes/report'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.route('/report', reportRoute)

export default app