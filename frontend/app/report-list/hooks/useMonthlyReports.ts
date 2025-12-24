"use client";

import { useEffect, useState, useCallback } from "react";
import { DailyReportListItem, UserForSelect } from "../../../../shared/types/DailyReport";
import { getUserMonthlyReports } from "@/app/actions/daily-reports";

export function useMonthlyReports(user: UserForSelect | null, currentMonth: Date) {
    const [reports, setReports] = useState<DailyReportListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchReports = useCallback(async () => {
        if (!user) {
            setReports([]);
            return;
        }

        try {
            setIsLoading(true);
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const yearMonth = `${year}-${month}`;

            const data = await getUserMonthlyReports(user.id, yearMonth);
            setReports(data.reports);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
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
