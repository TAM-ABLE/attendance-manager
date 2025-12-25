import { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "email", type: "text" },
                password: { label: "password", type: "password" }
            },
            async authorize(credentials) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials?.email,
                        password: credentials?.password,
                    }),
                });

                if (!res.ok) return null;

                const json = await res.json();
                const { token, user } = json.data;

                return { ...user, token };
            }
        })
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.apiToken = user.token; // backend JWT を保存
            }
            return token;
        },

        async session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.apiToken = token.apiToken; // Session に反映

            return session;
        }
    },

    pages: {
        signIn: "/login",
    }
}