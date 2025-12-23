"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { DayAttendance } from "../../../shared/types/Attendance";

export async function getUserMonth(userId: string, year: number, month: number): Promise<DayAttendance[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/get-user-month?userId=${userId}&year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get user month failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getUserMonth Error:", err);
        return [];
    }
}
