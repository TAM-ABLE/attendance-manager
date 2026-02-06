// frontend/app/report-list/hooks/useReportUsers.ts
"use client"

import type { UserForSelect } from "@attendance-manager/shared/types/DailyReport"
import { useCallback } from "react"
import { useUserSelect } from "@/hooks/useUserSelect"
import { apiClient } from "@/lib/api-client"
import { withRetry } from "@/lib/auth/with-retry"

function getDailyReportUsers() {
  return apiClient<UserForSelect[]>("/daily-reports/users")
}

export function useReportUsers(initialData?: UserForSelect[]) {
  const fetchFn = useCallback(() => withRetry(getDailyReportUsers), [])
  return useUserSelect<UserForSelect>({ fetchFn, initialData })
}
