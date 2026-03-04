"use client"

import useSWR from "swr"
import { getUserMonthlyAttendance } from "@/lib/api-services/admin"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { isValidUUID } from "@/lib/constants"
import { SWR_KEYS } from "@/lib/swr-keys"
import type { User } from "@/types/Attendance"

export function useMonthlyAttendance(user: User | null, date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  const hasValidUser = user !== null && isValidUUID(user.id)

  const { data, error, mutate } = useSWR(
    hasValidUser ? SWR_KEYS.monthlyAttendance(user!.id, year, month) : null,
    () => withRetryFetcher(() => getUserMonthlyAttendance(user!.id, year, month)),
  )

  return {
    monthData: data ?? null,
    error: error?.message ?? null,
    refetch: () => mutate(),
  }
}
