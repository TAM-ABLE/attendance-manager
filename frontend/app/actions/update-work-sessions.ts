"use server";

//app/actions/update-work-sessions.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { WorkSession } from "../../../shared/types/Attendance";

export async function updateWorkSessions(userId: string, date: string, sessions: WorkSession[]) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/update-user-date-work-sessions`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, date, sessions }),
        });

        if (!res.ok) {
            throw new Error(`Update-work-sessions failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("updateWorkSessions Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
