// backend/src/routes/attendance/index.ts
import { Hono } from 'hono';
import clockRouter from './clock';
import breaksRouter from './breaks';
import queriesRouter from './queries';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

const attendanceRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Clock operations: /attendance/clock-in, /attendance/clock-out
attendanceRouter.route('/', clockRouter);

// Break operations: /attendance/breaks/start, /attendance/breaks/end
attendanceRouter.route('/breaks', breaksRouter);

// Query operations: /attendance/today, /attendance/month, /attendance/week/total
attendanceRouter.route('/', queriesRouter);

export default attendanceRouter;
