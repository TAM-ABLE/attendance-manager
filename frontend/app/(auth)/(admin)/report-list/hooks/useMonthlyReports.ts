"use client";

import { useEffect, useState, useCallback } from "react";
import { DailyReportListItem, UserForSelect } from "@attendance-manager/shared/types/DailyReport";
import { apiClient } from "@/lib/api-client";
import { withRetry } from "@/lib/auth/with-retry";
import { formatYearMonthFromDate } from "@attendance-manager/shared/lib/time";

interface UserMonthlyReportsResponse {
    user: UserForSelect | null;
    yearMonth: string;
    reports: DailyReportListItem[];
}

function getUserMonthlyReports(userId: string, yearMonth: string) {
    return apiClient<UserMonthlyReportsResponse>(`/daily-reports/user/${userId}/month/${yearMonth}`);
}

export function useMonthlyReports(user: UserForSelect | null, currentMonth: Date) {
    const [reports, setReports] = useState<DailyReportListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        // userまたはそのidが空の場合はAPIを呼び出さない
        if (!user || !user.id || user.id.trim() === "") {
            setReports([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const yearMonth = formatYearMonthFromDate(currentMonth);

            const result = await withRetry(() => getUserMonthlyReports(user.id, yearMonth));
            if (result.success) {
                setReports(result.data.reports);
            } else {
                console.error("Failed to fetch reports:", result.error.message);
                setError(result.error.message);
                setReports([]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentMonth]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return {
        reports,
        isLoading,
        error,
        refetch: fetchReports,
    };
}
