"use client"

import { useCallback, useEffect, useState } from "react"
import { getUserMonthlyReports } from "@/lib/api-services/daily-reports"
import { withRetry } from "@/lib/auth/with-retry"
import { formatYearMonthFromDate } from "@/lib/time"
import type { DailyReportListItem, UserForSelect } from "@/types/DailyReport"

export function useMonthlyReports(user: UserForSelect | null, currentMonth: Date) {
  const [reports, setReports] = useState<DailyReportListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    // userまたはそのidが空の場合はAPIを呼び出さない
    if (!user || !user.id || user.id.trim() === "") {
      setReports([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const yearMonth = formatYearMonthFromDate(currentMonth)

      const result = await withRetry(() => getUserMonthlyReports(user.id, yearMonth))
      if (result.success) {
        setReports(result.data.reports)
      } else {
        console.error("Failed to fetch reports:", result.error.message)
        setError(result.error.message)
        setReports([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [user, currentMonth])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
  }
}
