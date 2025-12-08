// backend/src/routes/database/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import slackClockInReportRoute from './clock-in-report';
import slackClockOutReportRoute from './clock-out-report';
import { Env } from '../../types/env';

const database = new Hono<{ Bindings: Env }>();

database.use('*', cors());

// 各ルーターをマウント
database.route('/clock-in-report', slackClockInReportRoute);
database.route('/clock-out-report', slackClockOutReportRoute);

export default database;