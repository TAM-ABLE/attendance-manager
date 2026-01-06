// backend/src/routes/auth/login.ts
import { createRoute } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../../lib/supabase";
import { unauthorizedError, successResponse } from "../../../lib/errors";
import { setAuthCookie } from "../../../lib/cookie";
import { Env } from "../../types/env";
import {
    loginRequestSchema,
    loginResponseSchema,
    errorResponseSchema,
    successResponseSchema,
} from "../../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const loginRouter = createOpenAPIHono<{ Bindings: Env }>();

const loginRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["認証"],
    summary: "ログイン",
    description: "メールアドレスとパスワードでログインし、JWTトークンを取得します。",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: loginRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(loginResponseSchema),
                },
            },
            description: "ログイン成功",
        },
        400: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "バリデーションエラー",
        },
        401: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "認証エラー",
        },
    },
});

loginRouter.openapi(loginRoute, async (c) => {
    const supabase = getSupabaseClient(c.env);
    const { email, password } = c.req.valid("json");

    // Supabase Auth でログイン
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.session) {
        console.error("Login error:", error?.message, error?.status, error);
        return unauthorizedError(c, "Invalid credentials");
    }

    const { user, session } = data;

    // HttpOnly Cookie にトークンを設定
    setAuthCookie(c, session.access_token);

    return successResponse(c, {
        accessToken: session.access_token,
        user: {
            id: user.id,
            name: (user.user_metadata?.name as string) ?? "",
            email: user.email ?? "",
            role: (user.user_metadata?.role as "admin" | "user") ?? "user",
        },
    });
});

export default loginRouter;
