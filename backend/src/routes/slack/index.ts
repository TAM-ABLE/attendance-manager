// backend/src/routes/database/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import slackClockInReportRoute from './clock-in-report';
import slackClockOutReportRoute from './clock-out-report';

type Env = {
    SLACK_BOT_TOKEN: string;
    SLACK_CHANNEL_ID: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const database = new Hono<{ Bindings: Env }>();

database.use('*', cors());

// 各ルーターをマウント
database.route('/clock-in-report', slackClockInReportRoute);
database.route('/clock-out-report', slackClockOutReportRoute);

export default database;