"use client"

import useSWR from "swr"
import { getUserMonthlyReports } from "@/lib/api-services/daily-reports"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import { formatYearMonthFromDate } from "@/lib/time"
import type { DailyReportListItem, UserForSelect } from "@/types/DailyReport"

export function useMonthlyReports(user: UserForSelect | null, currentMonth: Date) {
  const validUser = user?.id?.trim() ? user : null
  const yearMonth = formatYearMonthFromDate(currentMonth)

  const {
    data: reports = [],
    isLoading,
    error,
  } = useSWR<DailyReportListItem[]>(
    validUser ? SWR_KEYS.monthlyReports(validUser.id, yearMonth) : null,
    () =>
      withRetryFetcher(() => getUserMonthlyReports(validUser!.id, yearMonth)).then(
        (res) => res.reports,
      ),
  )

  return {
    reports,
    isLoading,
    error: error?.message ?? null,
  }
}
