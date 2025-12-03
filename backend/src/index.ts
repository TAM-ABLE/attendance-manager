// backend/src/index.ts
import { Hono } from 'hono'
import databaseRoute from './routes/database'
import authRoute from './routes/auth'
import slackRoute from './routes/slack'

type Env = {
    SLACK_BOT_TOKEN: string;
    SLACK_CHANNEL_ID: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.route('/auth', authRoute);
app.route("/database", databaseRoute);
app.route("/slack", slackRoute)
export default app