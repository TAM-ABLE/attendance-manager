// backend/src/index.ts
import { Hono } from 'hono'
import slackRoute from './routes/slack'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.route('/slack', slackRoute)

export default app