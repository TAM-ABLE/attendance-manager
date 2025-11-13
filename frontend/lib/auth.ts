// /lib/auth.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import type { User } from "next-auth"

export async function getCurrentUser(): Promise<User | null> {
    const session = await getServerSession(authOptions)
    return session?.user ?? null
}