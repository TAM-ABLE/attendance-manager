"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

interface WeekTotalResponse {
    netWorkMs: number;
}

export async function getWeekTotal(): Promise<WeekTotalResponse | null> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/get-week-total`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get week total failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getWeekTotal Error:", err);
        return null;
    }
}
