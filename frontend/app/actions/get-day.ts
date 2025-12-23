"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AttendanceRecord } from "../../../shared/types/Attendance";

export async function getDay(): Promise<AttendanceRecord | null> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/get-day`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get day failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getDay Error:", err);
        return null;
    }
}
