"use client"

import { Download } from "lucide-react"
import dynamic from "next/dynamic"
import { useCallback, useState } from "react"
import { MonthNavigator } from "@/components/MonthNavigator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportMonthlyAttendanceCSV } from "@/lib/exportCsv"
import type { User } from "@/types/Attendance"
import { useEditDialog } from "../hooks/useEditDialog"
import { useMonthlyAttendance } from "../hooks/useMonthlyAttendance"
import { useUsers } from "../hooks/useUsers"
import { UserMonthlyAttendance } from "./UserMonthlyAttendance"

const EditAttendanceDialog = dynamic(
  () => import("./EditAttendanceDialog").then((mod) => mod.EditAttendanceDialog),
  { ssr: false },
)

type MonthlyAttendanceViewProps = {
  initialUsers?: User[]
}

export function MonthlyAttendanceView({ initialUsers }: MonthlyAttendanceViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { users, selectedUser, setSelectedUser } = useUsers(initialUsers)
  const { monthData, refetch } = useMonthlyAttendance(selectedUser, currentMonth)

  const editDialog = useEditDialog(selectedUser, refetch)

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
            {/* 個人選択 */}
            <Select
              value={selectedUser?.employeeNumber}
              onValueChange={(employeeNumber) => {
                const user = users.find((u) => u.employeeNumber === employeeNumber)
                if (user) setSelectedUser(user)
              }}
            >
              <SelectTrigger className="flex-1 sm:flex-none sm:w-40">
                <SelectValue placeholder="ユーザーを選択" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.employeeNumber} value={u.employeeNumber}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
