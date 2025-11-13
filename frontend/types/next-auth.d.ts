// /types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user?: {
            id?: string
            name?: string
            email?: string
            role?: "admin" | "user"
        } & DefaultSession["user"]
    }

    interface User {
        id?: string
        name?: string
        email?: string
        role?: "admin" | "user"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        role?: "admin" | "user"
    }
}