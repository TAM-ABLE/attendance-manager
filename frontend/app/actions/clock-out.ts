"use server";

//app/actions/clock-out.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Task } from "../../../shared/types/Attendance";

export async function clockOutWithTasks(actualTasks: Task[], summary: string, issues: string, notes: string) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        // DB側 clock-out
        const dbRes = await fetch(`${apiUrl}/database/attendance/clock-out`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!dbRes.ok) {
            throw new Error(`Database clock-out failed: ${dbRes.status}`);
        }

        // Slack通知
        const slackRes = await fetch(`${apiUrl}/slack/clock-out-report`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName: session.user.name,
                actualTasks,
                summary,
                issues,
                notes
            }),
        });

        if (!slackRes.ok) {
            throw new Error(`Slack notification failed: ${slackRes.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("clockOutWithTasks Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
