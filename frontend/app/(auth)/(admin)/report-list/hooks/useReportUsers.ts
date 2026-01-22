// frontend/app/report-list/hooks/useReportUsers.ts
"use client";

import { useCallback } from "react";
import { UserForSelect } from "@attendance-manager/shared/types/DailyReport";
import { apiClient } from "@/lib/api-client";
import { withRetry } from "@/lib/auth/with-retry";
import { useUserSelect } from "@/hooks/useUserSelect";

function getDailyReportUsers() {
    return apiClient<UserForSelect[]>("/daily-reports/users");
}

export function useReportUsers() {
    const fetchFn = useCallback(() => withRetry(getDailyReportUsers), []);
    return useUserSelect<UserForSelect>({ fetchFn });
}
