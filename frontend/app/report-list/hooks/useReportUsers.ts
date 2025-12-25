// frontend/app/report-list/hooks/useReportUsers.ts
"use client";

import { useCallback } from "react";
import { UserForSelect } from "../../../../shared/types/DailyReport";
import { getDailyReportUsers } from "@/app/actions/daily-reports";
import { useUserSelect } from "@/hooks/useUserSelect";

export function useReportUsers() {
    const fetchFn = useCallback(() => getDailyReportUsers(), []);
    return useUserSelect<UserForSelect>({ fetchFn });
}
