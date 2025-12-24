// backend/src/routes/admin/index.ts
import { Hono } from 'hono';
import usersRouter from './users';
import { Env } from '../../types/env';
import { AuthVariables } from '../../middleware/auth';

const adminRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// User and attendance operations: /admin/users/*
adminRouter.route('/users', usersRouter);

export default adminRouter;
