"use client"

import dynamic from "next/dynamic"
import { useRef } from "react"
import useSWR from "swr"
import { HelpPopover } from "@/components/HelpPopover"
import { MonthNavigator } from "@/components/MonthNavigator"
import { UserMonthlyAttendance } from "@/components/UserMonthlyAttendance"
import { Card, CardContent } from "@/components/ui/card"
import { useMonthNavigation } from "@/hooks/useMonthNavigation"
import { getMonth } from "@/lib/api-services/attendance"
import { withRetryFetcher } from "@/lib/auth/with-retry"
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
  const { currentMonth, handlePrevMonth, handleNextMonth, handleToday } = useMonthNavigation()

  const yearMonth = formatYearMonthFromDate(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  const initialYearMonthRef = useRef(initialData?.yearMonth)
  const isInitialMonth = initialYearMonthRef.current === yearMonth

  const { data: monthData, mutate } = useSWR(
    SWR_KEYS.attendanceMonth(yearMonth),
    () => withRetryFetcher(() => getMonth(year, month)),
    {
      fallbackData: isInitialMonth ? initialData?.attendanceData : undefined,
      revalidateOnMount: !isInitialMonth || !initialData,
    },
  )

  const editDialog = useEditDialog(() => mutate())

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">勤怠編集</h2>
          <p className="text-muted-foreground">自分の勤怠データを編集できます。</p>
        </div>
        <HelpPopover>
          <div className="space-y-3">
            <h4 className="font-semibold">勤怠編集の使い方</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">月の移動：</strong>
                表示月を切り替えられます。
              </p>
              <p>
                <strong className="text-foreground">勤怠の編集：</strong>
                編集する日付の編集ボタンをクリックすると、その日の出勤・退勤時間を編集できます。
              </p>
              <p>
                <strong className="text-foreground">複数回出勤：</strong>
                1日に複数回出勤すると、出勤2・出勤3と追加されていきます。
              </p>
              <p>
                <strong className="text-foreground">月次締め：</strong>
                月初に勤怠を締めるボタンを押すと、その月の勤怠が確定されます。
              </p>
            </div>
          </div>
        </HelpPopover>
      </div>

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
