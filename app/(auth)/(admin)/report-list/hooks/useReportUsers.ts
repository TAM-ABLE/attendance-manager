// app/report-list/hooks/useReportUsers.ts
"use client"

import { useCallback } from "react"
import { useUserSelect } from "@/hooks/useUserSelect"
import { getDailyReportUsers } from "@/lib/api-services/daily-reports"
import { withRetry } from "@/lib/auth/with-retry"
import type { UserForSelect } from "@/types/DailyReport"

export function useReportUsers(initialData?: UserForSelect[]) {
  const fetchFn = useCallback(() => withRetry(getDailyReportUsers), [])
  return useUserSelect<UserForSelect>({ fetchFn, initialData })
}
