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
        // DB側 update-work-sessions
        const dbRes = await fetch(`${apiUrl}/database/attendance/update-user-date-work-sessions`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, date, sessions }),
        });

        if (!dbRes.ok) {
            throw new Error(`Database update-work-sessions failed: ${dbRes.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("updateWorkSessions Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
