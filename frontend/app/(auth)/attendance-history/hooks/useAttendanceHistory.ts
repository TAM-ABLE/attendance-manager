"use client"

import { formatYearMonthFromDate, toJSTDateString } from "@attendance-manager/shared/lib/time"
import type { AttendanceRecord } from "@attendance-manager/shared/types/Attendance"
import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { getMonth } from "@/lib/api-services/attendance"
import { withRetry } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"

export type AttendanceHistoryInitialData = {
  attendanceData: AttendanceRecord[]
  yearMonth: string
}

export function useAttendanceHistory(initialData?: AttendanceHistoryInitialData) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // SWRキーを生成
  const yearMonth = formatYearMonthFromDate(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  // 初期データのyearMonthを保持（月変更検出用）
  const initialYearMonthRef = useRef(initialData?.yearMonth)

  // 現在の月が初期データの月と一致するかどうか
  const isInitialMonth = initialYearMonthRef.current === yearMonth

  // SWRでデータ取得（キャッシュ付き、401 時は自動リフレッシュ）
  const {
    data: attendanceData,
    error: swrError,
    isLoading: loading,
    mutate,
  } = useSWR(
    SWR_KEYS.attendanceMonth(yearMonth),
    async () => {
      const result = await withRetry(() => getMonth(year, month))
      if (result.success) {
        return result.data
      }
      throw new Error(result.error.message)
    },
    {
      // 初期データがある場合はfallbackDataとして使用
      fallbackData: isInitialMonth ? initialData?.attendanceData : undefined,
      // 初期月以外または初期データがない場合は再取得
      revalidateOnMount: !isInitialMonth || !initialData,
      // 5分間キャッシュ
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  )

  // 選択している日のデータを取得
  const selectedDayData = useMemo(() => {
    if (!attendanceData) return null
    return attendanceData.find((r) => r.date === toJSTDateString(selectedDate)) || null
  }, [attendanceData, selectedDate])

  return {
    attendanceData: attendanceData ?? [],
    selectedDayData,
    selectedDate,
    currentMonth,
    loading,
    error: swrError?.message ?? null,
    setCurrentMonth,
    setSelectedDate,
    refresh: () => mutate(),
  }
}
