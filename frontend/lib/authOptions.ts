import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

type AppUser = {
    id: string
    name: string
    email: string
    password: string
    role: "admin" | "user"
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "メールアドレス", type: "email" },
                password: { label: "パスワード", type: "password" },
            },
            async authorize(credentials, _req): Promise<Omit<AppUser, "password"> | null> {
                const users: AppUser[] = [
                    { id: "1", name: "管理者", email: "admin@example.com", password: "demo123", role: "admin" },
                    { id: "2", name: "一般ユーザー", email: "user@example.com", password: "demo123", role: "user" },
                ]

                const found = users.find(
                    (u) => u.email === credentials?.email && u.password === credentials?.password
                )

                if (!found) return null

                const { password, ...userWithoutPassword } = found
                return userWithoutPassword
            },
        }),
    ],
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
            }
            return session
        },
    },
}