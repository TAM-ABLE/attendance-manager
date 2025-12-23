// backend/src/routes/users.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';

const usersRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

usersRouter.get('/', async (c) => {
    // DB 処理
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

export default usersRouter;
