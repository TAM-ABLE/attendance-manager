"use server";

// frontend/app/actions/admin.ts

import { apiClient, apiClientNoCache } from "@/lib/api-client";
import type { User, AttendanceRecord, WorkSession } from "@attendance-manager/shared/types/Attendance";
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse";
import { isCurrentMonth, formatYearMonth } from "@attendance-manager/shared/lib/time";
import { CACHE_CURRENT_MONTH_SEC, CACHE_PAST_MONTH_SEC } from "@attendance-manager/shared/lib/constants";

// ============ User Operations ============

export async function getUsers(): Promise<ApiResult<User[]>> {
    return apiClientNoCache("/admin/users");
}

// ============ Attendance Operations ============

export async function getUserMonthlyAttendance(
    userId: string,
    year: number,
    month: number
): Promise<ApiResult<AttendanceRecord[]>> {
    // month は 0-indexed (Date.getMonth() から) なので +1 して YYYY-MM 形式に変換
    const actualMonth = month + 1;
    const yearMonth = formatYearMonth(year, actualMonth);
    const revalidate = isCurrentMonth(year, actualMonth) ? CACHE_CURRENT_MONTH_SEC : CACHE_PAST_MONTH_SEC;

    return apiClient(`/admin/users/${userId}/attendance/month/${yearMonth}`, { revalidate });
}

export async function getUserDateSessions(userId: string, date: string): Promise<ApiResult<WorkSession[]>> {
    return apiClientNoCache(`/admin/users/${userId}/attendance/${date}/sessions`);
}

export async function updateUserDateSessions(
    userId: string,
    date: string,
    sessions: WorkSession[]
): Promise<ApiResult<null>> {
    return apiClient(`/admin/users/${userId}/attendance/${date}/sessions`, {
        method: "PUT",
        body: { sessions },
    });
}
