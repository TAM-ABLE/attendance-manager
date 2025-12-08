// backend/src/routes/database/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from '../../types/env';
import attendanceUsersRouter from './attendance/users';
import attendanceDayRouter from './attendance/day';
import attendanceMonthRouter from './attendance/month'
import attendanceClockInRouter from './attendance/clock-in';
import attendanceClockOutRouter from './attendance/clock-out';
import attendanceBreakStartRouter from './attendance/break-start';
import attendanceBreakEndRouter from './attendance/break-end'
import attendanceWeekTotalHoursRouter from './attendance/week-total-hours'
import attendanceUserMonthRouter from './attendance/user-month';
import attendanceGetUserDateSessions from './attendance/get-user-date-work-sessions';
import attendanceUpdateUserDateSessions from './attendance/update-user-date-work-sessions';

const database = new Hono<{ Bindings: Env }>();

database.use('*', cors());

// 各ルーターをマウント
database.route('/attendance/update-user-date-work-sessions', attendanceUpdateUserDateSessions);
database.route('/attendance/get-user-date-work-sessions', attendanceGetUserDateSessions)
database.route('/attendance/users', attendanceUsersRouter);
database.route('/attendance/user-month', attendanceUserMonthRouter);
database.route('/attendance/day', attendanceDayRouter);
database.route('/attendance/month', attendanceMonthRouter);
database.route('/attendance/clock-in', attendanceClockInRouter);
database.route('/attendance/clock-out', attendanceClockOutRouter);
database.route('/attendance/break-start', attendanceBreakStartRouter);
database.route('/attendance/break-end', attendanceBreakEndRouter);
database.route('/attendance/week-total-hours', attendanceWeekTotalHoursRouter);

export default database;