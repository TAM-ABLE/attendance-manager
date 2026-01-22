// backend/src/routes/auth/logout.ts
import { createRoute } from "@hono/zod-openapi";
import { successResponse } from "../../../lib/errors";
import { Env } from "../../types/env";
import { z } from "zod";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const logoutRouter = createOpenAPIHono<{ Bindings: Env }>();

const logoutResponseSchema = z.object({
    message: z.string(),
});

const successResponseSchema = z.object({
    success: z.literal(true),
    data: logoutResponseSchema,
});

const logoutRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["認証"],
    summary: "ログアウト",
    description: "ログアウトします（クライアント側でトークンを破棄してください）",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema,
                },
            },
            description: "ログアウト成功",
        },
    },
});

logoutRouter.openapi(logoutRoute, async (c) => {
    return successResponse(c, {
        message: "Logged out successfully",
    });
});

export default logoutRouter;
