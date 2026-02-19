"use client"

import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"
import useSWR from "swr"
import { MonthNavigator } from "@/components/MonthNavigator"
import { UserMonthlyAttendance } from "@/components/UserMonthlyAttendance"
import { Card, CardContent } from "@/components/ui/card"
import { getMonth } from "@/lib/api-services/attendance"
import { withRetry } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import { formatYearMonthFromDate } from "@/lib/time"
import type { AttendanceRecord } from "@/types/Attendance"
import { useEditDialog } from "../hooks/useEditDialog"
import { CloseMonthButton } from "./CloseMonthButton"

const EditAttendanceDialog = dynamic(
  () => import("@/components/EditAttendanceDialog").then((mod) => mod.EditAttendanceDialog),
  { ssr: false },
)

type EditAttendanceClientProps = {
  user: { name: string; email: string }
  initialData?: {
    attendanceData: AttendanceRecord[]
    yearMonth: string
  }
}

export function EditAttendanceClient({ user, initialData }: EditAttendanceClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const yearMonth = formatYearMonthFromDate(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  const initialYearMonthRef = useRef(initialData?.yearMonth)
  const isInitialMonth = initialYearMonthRef.current === yearMonth

  const { data: monthData, mutate } = useSWR(
    SWR_KEYS.attendanceMonth(yearMonth),
    async () => {
      const result = await withRetry(() => getMonth(year, month))
      if (result.success) {
        return result.data
      }
      throw new Error(result.error.message)
    },
    {
      fallbackData: isInitialMonth ? initialData?.attendanceData : undefined,
      revalidateOnMount: !isInitialMonth || !initialData,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  )

  const editDialog = useEditDialog(() => mutate())

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() - 1)
      return d
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + 1)
      return d
    })
  }, [])

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date())
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl font-semibold">勤怠編集</h2>
      <p className="text-muted-foreground">自分の勤怠データを編集できます。</p>

      {/* 月移動 */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <MonthNavigator
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />
          <CloseMonthButton yearMonth={yearMonth} year={year} month={month} />
        </CardContent>
      </Card>

      {/* 勤怠表示 */}
      {monthData && (
        <UserMonthlyAttendance
          user={user}
          monthData={monthData}
          year={year}
          month={month}
          openEditDialog={editDialog.openDialog}
        />
      )}

      {/* 編集ダイアログ */}
      <EditAttendanceDialog
        open={editDialog.showEditDialog}
        date={editDialog.selectedDate}
        onClose={editDialog.closeDialog}
        onSave={editDialog.saveSessions}
        sessions={editDialog.sessions}
        setSessions={editDialog.setSessions}
      />
    </div>
  )
}
