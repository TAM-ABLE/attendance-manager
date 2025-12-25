"use client";

import { useEffect, useState, useCallback } from "react";
import { DailyReportListItem, UserForSelect } from "../../../../shared/types/DailyReport";
import { getUserMonthlyReports } from "@/app/actions/daily-reports";

export function useMonthlyReports(user: UserForSelect | null, currentMonth: Date) {
    const [reports, setReports] = useState<DailyReportListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        if (!user) {
            setReports([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const yearMonth = `${year}-${month}`;

            const result = await getUserMonthlyReports(user.id, yearMonth);
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
