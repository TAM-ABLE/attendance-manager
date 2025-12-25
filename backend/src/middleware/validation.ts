// backend/src/middleware/validation.ts
// Zodバリデーションミドルウェア

import type { Context, Next, MiddlewareHandler } from "hono";
import type { ZodSchema, ZodError } from "zod";
import { validationError } from "../../lib/errors";

/**
 * Zodのエラーを人間が読みやすい形式に変換
 */
function formatZodError(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join(".") || "root";
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(issue.message);
    }

    return formatted;
}

/**
 * リクエストボディをバリデーションするミドルウェア
 *
 * @example
 * clockRouter.post('/clock-in', validateBody(clockInRequestSchema), async (c) => {
 *     const body = c.get('validatedBody');
 *     // ...
 * });
 */
export function validateBody<T>(schema: ZodSchema<T>): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        try {
            const body = await c.req.json();
            const result = schema.safeParse(body);

            if (!result.success) {
                return validationError(c, "Invalid request body", {
                    errors: formatZodError(result.error),
                });
            }

            c.set("validatedBody", result.data);
            await next();
        } catch {
            return validationError(c, "Invalid JSON in request body");
        }
    };
}

/**
 * URLパラメータをバリデーションするミドルウェア
 *
 * @example
 * usersRouter.get('/:userId/attendance/:date', validateParams(userDateParamsSchema), async (c) => {
 *     const params = c.get('validatedParams');
 *     // params.userId, params.date は検証済み
 * });
 */
export function validateParams<T>(schema: ZodSchema<T>): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const params = c.req.param();
        const result = schema.safeParse(params);

        if (!result.success) {
            return validationError(c, "Invalid URL parameters", {
                errors: formatZodError(result.error),
            });
        }

        c.set("validatedParams", result.data);
        await next();
    };
}

/**
 * クエリパラメータをバリデーションするミドルウェア
 *
 * @example
 * usersRouter.get('/search', validateQuery(searchQuerySchema), async (c) => {
 *     const query = c.get('validatedQuery');
 * });
 */
export function validateQuery<T>(schema: ZodSchema<T>): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const query = c.req.query();
        const result = schema.safeParse(query);

        if (!result.success) {
            return validationError(c, "Invalid query parameters", {
                errors: formatZodError(result.error),
            });
        }

        c.set("validatedQuery", result.data);
        await next();
    };
}

// 型定義のための拡張（Context.get() で型を取得するため）
declare module "hono" {
    interface ContextVariableMap {
        validatedBody: unknown;
        validatedParams: unknown;
        validatedQuery: unknown;
    }
}
