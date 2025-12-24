"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
    DailyReport,
    DailyReportListItem,
    UserForSelect,
} from "../../../shared/types/DailyReport";

// ユーザー一覧取得（日報用）
export async function getDailyReportUsers(): Promise<UserForSelect[]> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/daily-reports/users`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get daily report users failed: ${res.status}`);
        }

        const data = await res.json();
        return data.users;
    } catch (err) {
        console.error("getDailyReportUsers Error:", err);
        return [];
    }
}

// 特定ユーザーの月別日報一覧取得
export async function getUserMonthlyReports(
    userId: string,
    yearMonth: string // 'YYYY-MM'
): Promise<{
    user: UserForSelect | null;
    yearMonth: string;
    reports: DailyReportListItem[];
}> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(
            `${apiUrl}/daily-reports/user/${userId}/month/${yearMonth}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            throw new Error(`Get user monthly reports failed: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("getUserMonthlyReports Error:", err);
        return { user: null, yearMonth, reports: [] };
    }
}

// 日報詳細取得
export async function getDailyReportDetail(
    reportId: string
): Promise<DailyReport | null> {
    const session = await getServerSession(authOptions);
    const token = session?.user?.apiToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) throw new Error("Unauthorized");

    try {
        const res = await fetch(`${apiUrl}/daily-reports/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Get daily report detail failed: ${res.status}`);
        }

        const data = await res.json();
        return data.report;
    } catch (err) {
        console.error("getDailyReportDetail Error:", err);
        return null;
    }
}
