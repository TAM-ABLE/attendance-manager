// backend/src/index.ts
import { Hono } from 'hono'
import slackRoute from './routes/slack'
import databaseRoute from './routes/database'

const app = new Hono<{ Bindings: { SLACK_WEBHOOK_URL: string } }>()

app.route('/slack', slackRoute)
app.route("/database", databaseRoute);

export default app