// hooks/useMonthlyAttendance.ts
"use client"

import { isValidUUID } from "@attendance-manager/shared/lib/constants"
import { formatYearMonth } from "@attendance-manager/shared/lib/time"
import type { AttendanceRecord, User } from "@attendance-manager/shared/types/Attendance"
import { useCallback, useState } from "react"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import { withRetry } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"

function getUserMonthlyAttendance(userId: string, year: number, month: number) {
  // month は 0-indexed (Date.getMonth() から) なので +1 して YYYY-MM 形式に変換
  const actualMonth = month + 1
  const yearMonth = formatYearMonth(year, actualMonth)
  return apiClient<AttendanceRecord[]>(`/admin/users/${userId}/attendance/month/${yearMonth}`)
}

export function useMonthlyAttendance(user: User | null, date: Date) {
  const [monthData, setMonthData] = useState<AttendanceRecord[] | null>(null)

  // userが存在し、かつ有効なUUIDを持つ場合のみtrue
  const hasValidUser = user !== null && isValidUUID(user.id)

  const fetcher = useCallback(async () => {
    console.log(
      "[useMonthlyAttendance] user:",
      user,
      "user.id:",
      user?.id,
      "isValidUUID:",
      user ? isValidUUID(user.id) : "N/A",
    )
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
