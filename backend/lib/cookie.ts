// backend/lib/cookie.ts
// HttpOnly Cookie 設定用ヘルパー

import type { Context } from "hono";

// アクセストークン有効期限: 7日
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Cookie 設定を取得
 */
function getCookieSettings(c: Context): { sameSite: string; secure: string } {
    const isProduction = c.env?.NODE_ENV === "production";
    const isCrossOrigin = c.env?.COOKIE_CROSS_ORIGIN === "true";

    if (isCrossOrigin) {
        return { sameSite: "None", secure: "; Secure" };
    }

    if (isProduction) {
        return { sameSite: "Lax", secure: "; Secure" };
    }

    return { sameSite: "Lax", secure: "" };
}

/**
 * 認証用 Cookie を設定
 */
export function setAuthCookie(c: Context, accessToken: string): void {
    const { sameSite, secure } = getCookieSettings(c);

    c.header(
        "Set-Cookie",
        `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=${ACCESS_TOKEN_MAX_AGE}; SameSite=${sameSite}${secure}`,
        { append: true }
    );
}

/**
 * 認証用 Cookie をクリア（ログアウト時）
 */
export function clearAuthCookie(c: Context): void {
    const { sameSite, secure } = getCookieSettings(c);

    c.header(
        "Set-Cookie",
        `accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`,
        { append: true }
    );
}
