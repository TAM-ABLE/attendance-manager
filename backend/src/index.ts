// backend/src/index.ts
import { Hono } from 'hono'
import databaseRoute from './routes/database'
import authRouter from './routes/auth/'

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.route('/auth', authRouter);
app.route("/database", databaseRoute);

export default app