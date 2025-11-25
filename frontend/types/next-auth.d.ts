import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role: "admin" | "user";
        token?: string; // ← backend から受け取る JWT
    }

    interface Session {
        user: {
            id: string;
            role: "admin" | "user";
            apiToken?: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "admin" | "user";
        apiToken?: string; // ← ここにも必要
    }
}