// backend/src/routes/auth/register.ts
import { createRoute } from "@hono/zod-openapi";
import bcrypt from "bcryptjs";
import { getSupabaseClient } from "../../../lib/supabase";
import { databaseError, successResponse } from "../../../lib/errors";
import { Env } from "../../types/env";
import {
    registerRequestSchema,
    registerResponseSchema,
    errorResponseSchema,
    successResponseSchema,
} from "../../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const registerRouter = createOpenAPIHono<{ Bindings: Env }>();

const registerRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["認証"],
    summary: "ユーザー登録",
    description: "新規ユーザーを登録します。",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: registerRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(registerResponseSchema),
                },
            },
            description: "登録成功",
        },
        400: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "バリデーションエラー",
        },
        500: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "サーバーエラー",
        },
    },
});

registerRouter.openapi(registerRoute, async (c) => {
    const supabase = getSupabaseClient(c.env);
    const { email, password, name } = c.req.valid("json");

    // パスワードをハッシュ化
    const hashed = await bcrypt.hash(password, 10);

    const employeeNumber = crypto.randomUUID().slice(0, 8);

    // DBに保存
    const { data, error } = await supabase
        .from("users")
        .insert({
            email,
            name,
            hashed_password: hashed,
            employee_number: employeeNumber,
            role: "user",
        })
        .select("*")
        .single();

    if (error) {
        return databaseError(c, error.message);
    }

    return successResponse(c, data);
});

export default registerRouter;
