// backend/src/routes/database/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import attendanceUsersRouter from './attendance/users';
import attendanceDayRouter from './attendance/day';
import attendanceMonthRouter from './attendance/month'
import attendanceClockInRouter from './attendance/clock-in';
import attendanceClockOutRouter from './attendance/clock-out';
import attendanceBreakStartRouter from './attendance/break-start';
import attendanceBreakEndRouter from './attendance/break-end'
import attendanceWeekTotalHoursRouter from './attendance/week-total-hours'

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const database = new Hono<{ Bindings: Env }>();

database.use('*', cors());

// 各ルーターをマウント
database.route('/attendance/users', attendanceUsersRouter);
database.route('/attendance/day', attendanceDayRouter);
database.route('/attendance/month', attendanceMonthRouter);
database.route('/attendance/clock-in', attendanceClockInRouter);
database.route('/attendance/clock-out', attendanceClockOutRouter);
database.route('/attendance/break-start', attendanceBreakStartRouter);
database.route('/attendance/break-end', attendanceBreakEndRouter);
database.route('/attendance/week-total-hours', attendanceWeekTotalHoursRouter);

export default database;