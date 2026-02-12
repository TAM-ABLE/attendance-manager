"use client"

import { Download } from "lucide-react"
import dynamic from "next/dynamic"
import { MonthNavigator } from "@/components/MonthNavigator"
import { UserMonthlyAttendance } from "@/components/UserMonthlyAttendance"
import { UserSelect } from "@/components/UserSelect"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMonthNavigation } from "@/hooks/useMonthNavigation"
import { exportMonthlyAttendanceCSV } from "@/lib/exportCsv"
import type { User } from "@/types/Attendance"
import { useEditDialog } from "../hooks/useEditDialog"
import { useMonthlyAttendance } from "../hooks/useMonthlyAttendance"
import { useUsers } from "../hooks/useUsers"

const EditAttendanceDialog = dynamic(
  () => import("@/components/EditAttendanceDialog").then((mod) => mod.EditAttendanceDialog),
  { ssr: false },
)

type MonthlyAttendanceViewProps = {
  initialUsers?: User[]
}

export function MonthlyAttendanceView({ initialUsers }: MonthlyAttendanceViewProps) {
  const { currentMonth, handlePrevMonth, handleNextMonth, handleToday } = useMonthNavigation()
  const { users, selectedUser, setSelectedUser } = useUsers(initialUsers)
  const { monthData, refetch } = useMonthlyAttendance(selectedUser, currentMonth)

  const editDialog = useEditDialog(selectedUser, refetch)

  const handleExportCSV = () => {
    if (!selectedUser) {
      alert("ユーザーが選択されていません。ユーザーを選択してからエクスポートしてください。")
      return
    }
    if (!monthData) {
      alert("勤怠データが読み込まれていません。しばらく待ってから再度お試しください。")
      return
    }
    exportMonthlyAttendanceCSV(monthData, selectedUser.name)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 月移動＆ユーザー選択 */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 月移動 */}
          <MonthNavigator
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />

          {/* ユーザー選択 & CSV */}
          <div className="flex items-center gap-2">
            <UserSelect users={users} value={selectedUser} onChange={setSelectedUser} />

            {/* CSVダウンロードボタン */}
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">CSVダウンロード</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 勤怠表示 */}
      {monthData && selectedUser && (
        <UserMonthlyAttendance
          user={selectedUser}
          monthData={monthData}
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth() + 1}
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
