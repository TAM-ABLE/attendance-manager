// backend/lib/openapi-hono.ts
// 共通設定を持つOpenAPIHonoインスタンスを作成するヘルパー

import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono/types";

/**
 * 共通設定を持つOpenAPIHonoインスタンスを作成
 * バリデーションエラーを統一形式 { success: false, error: { code, message } } で返す
 */
export function createOpenAPIHono<E extends Env = Env>() {
    return new OpenAPIHono<E>({
        defaultHook: (result, c) => {
            if (!result.success) {
                const firstIssue = result.error.issues[0];
                const message = firstIssue
                    ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
                    : "Validation failed";
                return c.json(
                    {
                        success: false as const,
                        error: { code: "VALIDATION_ERROR", message },
                    },
                    400
                );
            }
        },
    });
}
