"use server";

// frontend/app/actions/daily-reports.ts

import { apiClient, apiClientNoCache } from "@/lib/api-client";
import type { DailyReport, DailyReportListItem, UserForSelect } from "../../../shared/types/DailyReport";
import type { ApiResult } from "../../../shared/types/ApiResponse";
import { parseYearMonth, isCurrentMonth } from "../../../shared/lib/time";
import { CACHE_CURRENT_MONTH_SEC, CACHE_PAST_MONTH_SEC } from "../../../shared/lib/constants";

// ユーザー一覧取得（日報用）
export async function getDailyReportUsers(): Promise<ApiResult<UserForSelect[]>> {
    const result = await apiClientNoCache<{ users: UserForSelect[] }>("/daily-reports/users");

    if (!result.success) {
        return result;
    }

    return { success: true, data: result.data.users };
}

// 特定ユーザーの月別日報一覧レスポンス型
interface UserMonthlyReportsResponse {
    user: UserForSelect | null;
    yearMonth: string;
    reports: DailyReportListItem[];
}

// 特定ユーザーの月別日報一覧取得
export async function getUserMonthlyReports(
    userId: string,
    yearMonth: string // 'YYYY-MM'
): Promise<ApiResult<UserMonthlyReportsResponse>> {
    const parsed = parseYearMonth(yearMonth);
    const revalidate = parsed && isCurrentMonth(parsed.year, parsed.month)
        ? CACHE_CURRENT_MONTH_SEC
        : CACHE_PAST_MONTH_SEC;

    return apiClient(`/daily-reports/user/${userId}/month/${yearMonth}`, { revalidate });
}

// 日報詳細取得
export async function getDailyReportDetail(reportId: string): Promise<ApiResult<DailyReport>> {
    const result = await apiClientNoCache<{ report: DailyReport }>(`/daily-reports/${reportId}`);

    if (!result.success) {
        return result;
    }

    return { success: true, data: result.data.report };
}
