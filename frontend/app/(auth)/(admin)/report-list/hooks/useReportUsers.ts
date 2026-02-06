// frontend/app/report-list/hooks/useReportUsers.ts
"use client"

import type { UserForSelect } from "@attendance-manager/shared/types/DailyReport"
import { useCallback } from "react"
import { useUserSelect } from "@/hooks/useUserSelect"
import { getDailyReportUsers } from "@/lib/api-services/daily-reports"
import { withRetry } from "@/lib/auth/with-retry"

export function useReportUsers(initialData?: UserForSelect[]) {
  const fetchFn = useCallback(() => withRetry(getDailyReportUsers), [])
  return useUserSelect<UserForSelect>({ fetchFn, initialData })
}
