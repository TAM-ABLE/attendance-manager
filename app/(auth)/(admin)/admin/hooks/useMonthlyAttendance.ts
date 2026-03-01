"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { getUserMonthlyAttendance } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import { isValidUUID } from "@/lib/constants"
import { SWR_KEYS } from "@/lib/swr-keys"
import type { AttendanceRecord, User } from "@/types/Attendance"

export function useMonthlyAttendance(user: User | null, date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  // userが存在し、かつ有効なUUIDを持つ場合のみtrue
  const hasValidUser = user !== null && isValidUUID(user.id)

  const fetcher = useCallback(async (): Promise<AttendanceRecord[] | null> => {
    if (!user || !isValidUUID(user.id)) return null
    const result = await withRetry(() => getUserMonthlyAttendance(user.id, year, month))
    if (result.success) {
      return result.data
    }
    throw new Error(result.error.message)
  }, [user, year, month])

  const { data, error, mutate } = useSWR(
    hasValidUser ? SWR_KEYS.monthlyAttendance(user.id, year, month) : null,
    fetcher,
  )

  return {
    monthData: data ?? null,
    error: error?.message ?? null,
    refetch: () => mutate(),
  }
}
