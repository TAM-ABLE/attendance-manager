"use server";

// frontend/app/actions/attendance.ts

import { apiClient, apiClientNoCache } from "@/lib/api-client";
import type { Task, AttendanceRecord } from "@attendance-manager/shared/types/Attendance";
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse";
import { isCurrentMonth, formatYearMonth } from "@attendance-manager/shared/lib/time";
import { CACHE_CURRENT_MONTH_SEC, CACHE_PAST_MONTH_SEC } from "@attendance-manager/shared/lib/constants";

// ============ Clock Operations ============

export async function clockIn(
    userName: string,
    plannedTasks: Task[]
): Promise<ApiResult<{ slack_ts?: string }>> {
    return apiClient("/attendance/clock-in", {
        method: "POST",
        body: { userName, plannedTasks },
    });
}

export async function clockOut(
    userName: string,
    actualTasks: Task[],
    summary: string,
    issues: string,
    notes: string
): Promise<ApiResult<{ slack_ts?: string }>> {
    return apiClient("/attendance/clock-out", {
        method: "POST",
        body: { userName, actualTasks, summary, issues, notes },
    });
}

// ============ Break Operations ============

export async function startBreak(): Promise<ApiResult<null>> {
    return apiClient("/attendance/breaks/start", { method: "POST" });
}

export async function endBreak(): Promise<ApiResult<null>> {
    return apiClient("/attendance/breaks/end", { method: "POST" });
}

// ============ Query Operations ============

export async function getToday(): Promise<ApiResult<AttendanceRecord | null>> {
    return apiClientNoCache("/attendance/today");
}

export async function getMonth(year: number, month: number): Promise<ApiResult<AttendanceRecord[]>> {
    const yearMonth = formatYearMonth(year, month);
    const revalidate = isCurrentMonth(year, month) ? CACHE_CURRENT_MONTH_SEC : CACHE_PAST_MONTH_SEC;

    return apiClient(`/attendance/month/${yearMonth}`, { revalidate });
}

interface WeekTotalResponse {
    netWorkMs: number;
}

export async function getWeekTotal(): Promise<ApiResult<WeekTotalResponse | null>> {
    return apiClientNoCache("/attendance/week/total");
}
