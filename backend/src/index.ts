// backend/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoute from './routes/auth';
import breakEndRoute from './routes/break-end';
import breakStartRoute from './routes/break-start';
import clockInRoute from './routes/clock-in';
import clockOutRoute from './routes/clock-out';
import dailyReportsRoute from './routes/daily-reports';
import dayRoute from './routes/day';
import getUserDateWorkSessionsRoute from './routes/get-user-date-work-sessions';
import monthRoute from './routes/month';
import updateUserDateWorkSessionsRoute from './routes/update-user-date-work-sessions';
import userMonthRoute from './routes/user-month';
import usersRoute from './routes/users';
import weekTotalHoursRoute from './routes/week-total-hours';
import { authMiddleware, adminMiddleware, AuthVariables } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// グローバル CORS
app.use('*', cors());

// 認証不要: /auth
app.route('/auth', authRoute);

// 認証が必要なルート
app.use('/clock-in', authMiddleware);
app.use('/clock-in/*', authMiddleware);
app.use('/clock-out', authMiddleware);
app.use('/clock-out/*', authMiddleware);
app.use('/break-start', authMiddleware);
app.use('/break-start/*', authMiddleware);
app.use('/break-end', authMiddleware);
app.use('/break-end/*', authMiddleware);
app.use('/get-day', authMiddleware);
app.use('/get-day/*', authMiddleware);
app.use('/month', authMiddleware);
app.use('/month/*', authMiddleware);
app.use('/get-week-total', authMiddleware);
app.use('/get-week-total/*', authMiddleware);

// 認証 + 管理者権限が必要なルート
app.use('/get-user-month', authMiddleware, adminMiddleware);
app.use('/get-user-month/*', authMiddleware, adminMiddleware);
app.use('/get-users', authMiddleware, adminMiddleware);
app.use('/get-users/*', authMiddleware, adminMiddleware);
app.use('/get-user-date-work-sessions', authMiddleware, adminMiddleware);
app.use('/get-user-date-work-sessions/*', authMiddleware, adminMiddleware);
app.use('/update-user-date-work-sessions', authMiddleware, adminMiddleware);
app.use('/update-user-date-work-sessions/*', authMiddleware, adminMiddleware);
app.use('/daily-reports', authMiddleware, adminMiddleware);
app.use('/daily-reports/*', authMiddleware, adminMiddleware);

// ルートをマウント
app.route('/clock-in', clockInRoute);
app.route('/clock-out', clockOutRoute);
app.route('/break-start', breakStartRoute);
app.route('/break-end', breakEndRoute);
app.route('/get-day', dayRoute);
app.route('/month', monthRoute);
app.route('/get-user-month', userMonthRoute);
app.route('/get-users', usersRoute);
app.route('/get-week-total', weekTotalHoursRoute);
app.route('/get-user-date-work-sessions', getUserDateWorkSessionsRoute);
app.route('/update-user-date-work-sessions', updateUserDateWorkSessionsRoute);
app.route('/daily-reports', dailyReportsRoute);

export default app;