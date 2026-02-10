// hooks/useMonthlyAttendance.ts
"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { getUserMonthlyAttendance } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import { isValidUUID } from "@/lib/constants"
import { SWR_KEYS } from "@/lib/swr-keys"
import type { AttendanceRecord, User } from "@/types/Attendance"

export function useMonthlyAttendance(user: User | null, date: Date) {
  const [monthData, setMonthData] = useState<AttendanceRecord[] | null>(null)

  // userが存在し、かつ有効なUUIDを持つ場合のみtrue
  const hasValidUser = user !== null && isValidUUID(user.id)

  const fetcher = useCallback(async () => {
    if (!user || !isValidUUID(user.id)) return null
    const result = await withRetry(() =>
      getUserMonthlyAttendance(user.id, date.getFullYear(), date.getMonth()),
    )
    if (result.success) {
      return result.data
    }
    throw new Error(result.error.message)
  }, [user, date])

  const { error, mutate } = useSWR(
    hasValidUser ? SWR_KEYS.monthlyAttendance(user.id, date.getFullYear(), date.getMonth()) : null,
    fetcher,
    {
      onSuccess: (data) => {
        setMonthData(data)
      },
      onError: (err) => {
        console.error("Failed to load monthly attendance:", err)
        setMonthData(null)
      },
    },
  )

  return {
    monthData,
    setMonthData,
    error: error?.message ?? null,
    refetch: () => mutate(),
  }
}
