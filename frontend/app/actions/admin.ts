"use server";

// frontend/app/actions/admin.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { User, AttendanceRecord, WorkSession } from "../../../shared/types/Attendance";

// ============ User Operations ============

export async function getUsers(): Promise<User[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/admin/users`, {
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

// ============ Attendance Operations ============

export async function getUserMonthlyAttendance(userId: string, year: number, month: number): Promise<AttendanceRecord[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/admin/users/${userId}/attendance/month?year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get user month failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getUserMonthlyAttendance Error:", err);
        return [];
    }
}

export async function getUserDateSessions(userId: string, date: string): Promise<WorkSession[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    const res = await fetch(
        `${apiUrl}/admin/users/${userId}/attendance/${date}/sessions`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
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

export async function updateUserDateSessions(userId: string, date: string, sessions: WorkSession[]) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/admin/users/${userId}/attendance/${date}/sessions`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessions }),
        });

        if (!res.ok) {
            throw new Error(`Update-work-sessions failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("updateUserDateSessions Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
