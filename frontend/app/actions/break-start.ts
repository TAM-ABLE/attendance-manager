"use server";

//app/actions/break-start.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function breakStart() {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/break-start`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            throw new Error(`Break-start failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("breakStart Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
