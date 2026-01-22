// frontend/app/api/auth/register/route.ts
// ユーザー登録用 Route Handler
// Hono API にリクエストを転送し、レスポンスのトークンを HttpOnly Cookie に保存

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Server側からHono APIに直接アクセスするためのURL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

// アクセストークン有効期限: 7日（秒）
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Hono API に登録リクエストを転送
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            // エラーレスポンスをそのまま返す
            return NextResponse.json(json, { status: res.status });
        }

        // 成功時: トークンを HttpOnly Cookie に保存
        const { accessToken } = json.data;
        const cookieStore = await cookies();

        cookieStore.set("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: ACCESS_TOKEN_MAX_AGE,
            path: "/",
        });

        // クライアントにはトークンを含まないレスポンスを返す
        return NextResponse.json({
            success: true,
            data: {
                user: json.data.user,
            },
        });
    } catch (err) {
        console.error("Register route error:", err);
        return NextResponse.json(
            {
                success: false,
                error: { code: "INTERNAL_ERROR", message: "登録に失敗しました" },
            },
            { status: 500 }
        );
    }
}
