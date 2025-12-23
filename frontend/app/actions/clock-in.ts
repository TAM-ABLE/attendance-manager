"use server";

//app/actions/clock-in.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Task } from "../../../shared/types/Attendance";

export async function clockInWithTasks(plannedTasks: Task[]) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/clock-in`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName: session.user.name,
                plannedTasks,
            }),
        });

        if (!res.ok) {
            throw new Error(`Clock-in failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("clockInWithTasks Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
