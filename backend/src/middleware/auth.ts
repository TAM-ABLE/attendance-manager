// backend/src/middleware/auth.ts
import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env } from '../types/env';
import { unauthorizedError, forbiddenError } from '../../lib/errors';

export type JwtPayload = {
    sub: string;  // Supabase Auth の user id
    role: 'admin' | 'user';
};

// Hono の Variables 型を拡張
export type AuthVariables = {
    jwtPayload: JwtPayload;
};

/**
 * Supabase JWT認証ミドルウェア
 * - Authorization ヘッダーから Bearer トークンを検証
 * - Supabase Auth の getUser() で検証
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

    try {
        // Supabase クライアントを作成して JWT を検証
        const supabase = createClient(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return unauthorizedError(c, 'Invalid token');
        }

        // user_metadata から role を取得
        const role = (user.user_metadata?.role as 'admin' | 'user') ?? 'user';

        c.set('jwtPayload', {
            sub: user.id,
            role,
        });

        await next();
    } catch (err) {
        console.error('Auth error:', err);
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
