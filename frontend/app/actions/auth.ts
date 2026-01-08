"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type LoginResult = { success: false; error: string };

/**
 * ログイン処理 (Server Action)
 * 成功時はredirectするため、戻り値はエラー時のみ
 */
export async function loginAction(email: string, password: string): Promise<LoginResult> {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "ログインに失敗しました",
            };
        }

        // バックエンドからのSet-CookieをNext.jsのcookiesに設定
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            const cookieStore = await cookies();
            // accessTokenを抽出して設定
            const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
            if (tokenMatch) {
                cookieStore.set("accessToken", tokenMatch[1], {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 60 * 60 * 24 * 7, // 7日
                    path: "/",
                });
            }
        }
    } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: "ログインに失敗しました" };
    }

    // Cookie設定後にリダイレクト（tryの外で呼ぶ）
    redirect("/dashboard");
}

type RegisterResult = { success: false; error: string };

/**
 * ユーザー登録処理 (Server Action)
 * 成功時はredirectするため、戻り値はエラー時のみ
 */
export async function registerAction(
    name: string,
    email: string,
    password: string,
    employeeNumber: string,
    role: "admin" | "user" = "user"
): Promise<RegisterResult> {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, employeeNumber, role }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            return {
                success: false,
                error: json.error?.message ?? "登録に失敗しました",
            };
        }

        // バックエンドからのSet-CookieをNext.jsのcookiesに設定
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            const cookieStore = await cookies();
            const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
            if (tokenMatch) {
                cookieStore.set("accessToken", tokenMatch[1], {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 60 * 60 * 24 * 7,
                    path: "/",
                });
            }
        }
    } catch (err) {
        console.error("Register error:", err);
        return { success: false, error: "登録に失敗しました" };
    }

    // Cookie設定後にリダイレクト（tryの外で呼ぶ）
    redirect("/dashboard");
}

/**
 * ログアウト処理 (Server Action)
 */
export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
}
