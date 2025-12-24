"use server";

// frontend/app/actions/attendance.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Task, AttendanceRecord } from "../../../shared/types/Attendance";

// ============ Clock Operations ============

export async function clockIn(plannedTasks: Task[]) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/clock-in`, {
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
        console.error("clockIn Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function clockOut(actualTasks: Task[], summary: string, issues: string, notes: string) {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/clock-out`, {
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
                notes,
            }),
        });

        if (!res.ok) {
            throw new Error(`Clock-out failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("clockOut Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

// ============ Break Operations ============

export async function startBreak() {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/breaks/start`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            throw new Error(`Break-start failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("startBreak Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function endBreak() {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/breaks/end`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            throw new Error(`Break-end failed: ${res.status}`);
        }

        return { success: true };
    } catch (err) {
        console.error("endBreak Error:", err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

// ============ Query Operations ============

export async function getToday(): Promise<AttendanceRecord | null> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/today`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get today failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getToday Error:", err);
        return null;
    }
}

export async function getMonth(year: number, month: number): Promise<AttendanceRecord[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/month?year=${year}&month=${month}`, {
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

interface WeekTotalResponse {
    netWorkMs: number;
}

export async function getWeekTotal(): Promise<WeekTotalResponse | null> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/attendance/week/total`, {
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
