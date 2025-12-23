"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { User } from "../../../shared/types/Attendance";

export async function getUsers(): Promise<User[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/get-users`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get users failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getUsers Error:", err);
        return [];
    }
}
