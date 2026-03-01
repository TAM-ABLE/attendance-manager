// app/report-list/hooks/useReportUsers.ts
"use client"

import { useUserSelect } from "@/hooks/useUserSelect"
import { getDailyReportUsers } from "@/lib/api-services/daily-reports"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import type { UserForSelect } from "@/types/DailyReport"

export function useReportUsers(initialData?: UserForSelect[]) {
  return useUserSelect<UserForSelect>({
    key: SWR_KEYS.REPORT_USERS,
    fetcher: () => withRetryFetcher(getDailyReportUsers),
    initialData,
  })
}
