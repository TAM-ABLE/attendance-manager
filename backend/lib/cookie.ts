// backend/lib/cookie.ts
// HttpOnly Cookie 設定用ヘルパー

import type { Context } from "hono";

// アクセストークン有効期限: 7日
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

interface CookieSettings {
    sameSite: string;
    secure: string;
    domain: string;
}

/**
 * Cookie 設定を取得
 */
function getCookieSettings(c: Context): CookieSettings {
    const isProduction = c.env?.NODE_ENV === "production";
    // サブドメイン間でCookieを共有するための親ドメイン（例: .attendance-manager.com）
    const cookieDomain = c.env?.COOKIE_DOMAIN || "";
    const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";

    if (isProduction) {
        return { sameSite: "Lax", secure: "; Secure", domain };
    }

    return { sameSite: "Lax", secure: "", domain: "" };
}

/**
 * 認証用 Cookie を設定
 */
export function setAuthCookie(c: Context, accessToken: string): void {
    const { sameSite, secure, domain } = getCookieSettings(c);

    c.header(
        "Set-Cookie",
        `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=${ACCESS_TOKEN_MAX_AGE}; SameSite=${sameSite}${secure}${domain}`,
        { append: true }
    );
}

/**
 * 認証用 Cookie をクリア（ログアウト時）
 */
export function clearAuthCookie(c: Context): void {
    const { sameSite, secure, domain } = getCookieSettings(c);

    c.header(
        "Set-Cookie",
        `accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${secure}${domain}`,
        { append: true }
    );
}
