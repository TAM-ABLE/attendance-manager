export async function getCurrentUser() {
    // 実際は認証システム（NextAuthなど）から取得
    return {
        name: "Admin User",
        email: "admin@example.com",
        isAdmin: true,
    };
}