// backend/src/middleware/auth.ts
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../types/env';
import { unauthorizedError, forbiddenError, internalError } from '../../lib/errors';

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
        return unauthorizedError(c, 'Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!c.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing');
        return internalError(c, 'JWT_SECRET is missing');
    }

    try {
        const payload = await verify(token, c.env.JWT_SECRET) as JwtPayload;
        c.set('jwtPayload', payload);
        await next();
    } catch {
        return unauthorizedError(c, 'Invalid token');
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
        return forbiddenError(c, 'Admin access required');
    }

    await next();
};
