// backend/src/routes/auth/login.ts
import { createRoute } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../../lib/supabase";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { unauthorizedError, successResponse } from "../../../lib/errors";
import { JWT_EXPIRATION_SECONDS } from "../../../../shared/lib/constants";
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

    // 3. JWT を作成
    const payload = {
        id: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION_SECONDS,
    };

    const token = await sign(payload, c.env.JWT_SECRET);

    // 4. レスポンス
    return successResponse(c, {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as "admin" | "user",
        },
    });
});

export default loginRouter;
