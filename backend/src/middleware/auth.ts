// backend/src/middleware/auth.ts
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../types/env';

export type JwtPayload = {
    id: string;
    role: 'admin' | 'user';
};

// Hono の Variables 型を拡張
export type AuthVariables = {
    jwtPayload: JwtPayload;
};

/**
 * JWT認証ミドルウェア
 * - Authorization ヘッダーから Bearer トークンを検証
 * - 検証成功時、payload を c.set('jwtPayload', payload) で保存
 */
export const authMiddleware = async (
    c: Context<{ Bindings: Env; Variables: AuthVariables }>,
    next: Next
) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    if (!c.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing');
        return c.json({ error: 'Server configuration error' }, 500);
    }

    try {
        const payload = await verify(token, c.env.JWT_SECRET) as JwtPayload;
        c.set('jwtPayload', payload);
        await next();
    } catch {
        return c.json({ error: 'Invalid token' }, 401);
    }
};

/**
 * 管理者専用ミドルウェア
 * - authMiddleware の後に使用
 * - role が 'admin' でなければ 403 を返す
 */
export const adminMiddleware = async (
    c: Context<{ Bindings: Env; Variables: AuthVariables }>,
    next: Next
) => {
    const payload = c.get('jwtPayload');

    if (payload.role !== 'admin') {
        return c.json({ error: 'Forbidden (admin only)' }, 403);
    }

    await next();
};
