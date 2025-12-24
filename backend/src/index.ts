// backend/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoute from './routes/auth';
import attendanceRoute from './routes/attendance';
import adminRoute from './routes/admin';
import dailyReportsRoute from './routes/daily-reports';
import { authMiddleware, adminMiddleware, AuthVariables } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// グローバル CORS
app.use('*', cors());

// 認証不要: /auth
app.route('/auth', authRoute);

// 認証が必要なルート: /attendance/*
app.use('/attendance/*', authMiddleware);
app.route('/attendance', attendanceRoute);

// 認証 + 管理者権限が必要なルート: /admin/*
app.use('/admin/*', authMiddleware, adminMiddleware);
app.route('/admin', adminRoute);

// 認証 + 管理者権限が必要なルート: /daily-reports/*
app.use('/daily-reports/*', authMiddleware, adminMiddleware);
app.route('/daily-reports', dailyReportsRoute);

export default app;
