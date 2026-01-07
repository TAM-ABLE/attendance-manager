// frontend/lib/get-base-url.ts
// Server側で使用するベースURL取得ユーティリティ

/**
 * Server Component / Server Actions用のベースURL取得
 * サーバー側で実行されるため、絶対URLが必要
 */
export function getServerBaseUrl(): string {
    // Vercel環境
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // 開発環境
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}
