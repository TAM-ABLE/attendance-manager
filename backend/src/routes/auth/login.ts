import { Hono } from 'hono';
import { getSupabaseClient } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { Env } from '../../types/env';
import { validationError, unauthorizedError } from '../../../lib/errors';

const loginRouter = new Hono<{ Bindings: Env }>();

loginRouter.post('/', async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { email, password } = await c.req.json();

    // 入力チェック
    if (!email || !password) {
        return validationError(c, "Missing email or password");
    }

    // 1. ユーザー取得
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (error || !user) {
        return unauthorizedError(c, "Invalid credentials");
    }

    // 2. パスワード検証
    const isValid = bcrypt.compareSync(password, user.hashed_password);
    if (!isValid) {
        return unauthorizedError(c, "Invalid credentials");
    }

    // 3. ここで JWT を作成！
    const payload = {
        id: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間
    };

    const token = await sign(payload, c.env.JWT_SECRET);

    // 4. フロントへ返す
    return c.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

export default loginRouter;