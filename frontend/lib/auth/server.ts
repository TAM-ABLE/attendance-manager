// frontend/lib/auth/server.ts
// Server Component用の認証ユーティリティ

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerBaseUrl } from "@/lib/get-base-url";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
};

/**
 * 現在のユーザーを取得（Server Component用）
 * 認証されていない場合はnullを返す
 * cache()により同一リクエスト内では1回だけAPIを呼ぶ
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
        return null;
    }

    try {
        const apiUrl = `${getServerBaseUrl()}/api/backend`;
        const res = await fetch(`${apiUrl}/auth/me`, {
            headers: {
                Cookie: `accessToken=${accessToken}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return null;
        }

        const json = await res.json();

        if (!json.success) {
            return null;
        }

        return json.data as AuthUser;
    } catch (err) {
        console.error("getUser error:", err);
        return null;
    }
});

/**
 * 認証必須ページ用 - 未認証ならログインへリダイレクト
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    return user;
}

/**
 * 管理者専用ページ用 - 管理者でなければダッシュボードへリダイレクト
 */
export async function requireAdmin(): Promise<AuthUser> {
    const user = await requireAuth();

    if (user.role !== "admin") {
        redirect("/dashboard");
    }

    return user;
}
