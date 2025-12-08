"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { WorkSession } from "../../../shared/types/Attendance";

export async function getWorkSessions(userId: string, date: string): Promise<WorkSession[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    const res = await fetch(
        `${apiUrl}/database/attendance/get-user-date-work-sessions?userId=${userId}&date=${date}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    let data: unknown;

    try {
        data = await res.json();
    } catch {
        console.error("Invalid JSON from backend");
        return [];
    }

    if (!Array.isArray(data)) {
        console.warn("Backend returned non-array:", data);
        return [];
    }

    return data as WorkSession[];
}