// frontend/app/report-list/hooks/useReportUsers.ts
"use client";

import { useCallback } from "react";
import { UserForSelect } from "@attendance-manager/shared/types/DailyReport";
import { getDailyReportUsers } from "@/app/actions/daily-reports";
import { withRetry } from "@/lib/auth/with-retry";
import { useUserSelect } from "@/hooks/useUserSelect";

export function useReportUsers() {
    const fetchFn = useCallback(() => withRetry(getDailyReportUsers), []);
    return useUserSelect<UserForSelect>({ fetchFn });
}
