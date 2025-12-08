"use server";

//app/actions/break-end.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function breakEnd() {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        // DB側 break-end
        const dbRes = await fetch(`${apiUrl}/database/attendance/break-end`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!dbRes.ok) {
            throw new Error(`Database break-end failed: ${dbRes.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("breakStart Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
