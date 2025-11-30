// backend/src/routes/database/attendance/users.ts
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getSupabaseClient } from '../../../../lib/supabase';

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceUsersRouter = new Hono<{ Bindings: Env }>();

attendanceUsersRouter.get('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    // --- JWT 検証 ---
    try {
        if (!c.env.JWT_SECRET) {
            console.error("JWT_SECRET missing");
            return c.json({ error: "Server configuration error" }, 500);
        }

        // payload が必要なら受け取れるけど、今回は ID は使わないので不要
        await verify(token, c.env.JWT_SECRET);

    } catch (e) {
        console.error("JWT verification failed:", e);
        return c.json({ error: "Invalid token" }, 401);
    }

    // --- DB 処理 ---
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, employee_number');

    if (error) {
        console.error(error);
        return c.json({ error: "Database error" }, 500);
    }

    // User 型に合わせて整形
    const formatted = data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        employeeId: u.employee_number,
    }));

    return c.json(formatted);
});

export default attendanceUsersRouter;