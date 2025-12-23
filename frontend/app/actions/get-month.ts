"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AttendanceRecord } from "../../../shared/types/Attendance";

export async function getMonth(year: number, month: number): Promise<AttendanceRecord[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/month?year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get month failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getMonth Error:", err);
        return [];
    }
}
