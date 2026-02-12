import { Edit } from "lucide-react"
import { useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatClockTime,
  formatDurationMs,
  formatDurationMsToHM,
  generateMonthDates,
  getDateLabel,
  getWeekdayLabel,
} from "@/lib/time"
import type { AttendanceRecord } from "@/types/Attendance"

interface Props {
  user: { name: string; email: string }
  monthData: AttendanceRecord[]
  year: number
  month: number
  openEditDialog: (date: string) => void
}

export const UserMonthlyAttendance = ({ user, monthData, year, month, openEditDialog }: Props) => {
  const workMonthDays = monthData.filter((d) => d.sessions.length > 0).length
  const totalMonthHours = monthData.reduce((acc, d) => acc + d.workTotalMs, 0)

  const allDates = useMemo(() => generateMonthDates(year, month), [year, month])

  const dataByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    for (const record of monthData) {
      map.set(record.date, record)
    }
    return map
  }, [monthData])

  const getInitials = (name: string) => name.slice(0, 2)

  const getWeekdayStyle = (dateStr: string) => {
    const day = new Date(dateStr).getDay()
    if (day === 0) return "bg-red-50"
    if (day === 6) return "bg-blue-50"
    return ""
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <div className="flex gap-4 text-sm justify-end">
            <div className="text-center">
              <p className="text-muted-foreground text-xs sm:text-sm">出勤日数</p>
              <p className="text-lg sm:text-xl">{workMonthDays}日</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs sm:text-sm">総勤務時間</p>
              <p className="text-lg sm:text-xl">{formatDurationMs(totalMonthHours)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <Table className="text-xs sm:text-sm min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">日付</TableHead>
                <TableHead className="whitespace-nowrap">曜日</TableHead>
                <TableHead className="whitespace-nowrap">出勤1</TableHead>
                <TableHead className="whitespace-nowrap">退勤1</TableHead>
                <TableHead className="whitespace-nowrap">出勤2</TableHead>
                <TableHead className="whitespace-nowrap">退勤2</TableHead>
                <TableHead className="whitespace-nowrap">出勤3</TableHead>
                <TableHead className="whitespace-nowrap">退勤3</TableHead>
                <TableHead className="whitespace-nowrap">休憩</TableHead>
                <TableHead className="whitespace-nowrap">合計</TableHead>
                <TableHead className="whitespace-nowrap" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDates.map((dateStr) => {
                const dayData = dataByDate.get(dateStr)
                const hasData = dayData != null && dayData.sessions.length > 0
                const dateLabel = getDateLabel(dateStr)
                const weekday = getWeekdayLabel(dateStr)

                // 各セッションの出退勤時刻を取得（最大3セッション）
                const getSessionTime = (index: number, type: "clockIn" | "clockOut") => {
                  if (!dayData) return "-"
                  const session = dayData.sessions[index]
                  if (!session) return "-"
                  const time = session[type]
                  return time ? formatClockTime(time) : "-"
                }

                return (
                  <TableRow key={dateStr} className={getWeekdayStyle(dateStr)}>
                    <TableCell className="whitespace-nowrap">{dateLabel}</TableCell>
                    <TableCell className="whitespace-nowrap">{weekday}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(0, "clockIn")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(0, "clockOut")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(1, "clockIn")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(1, "clockOut")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(2, "clockIn")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getSessionTime(2, "clockOut")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {hasData ? formatDurationMsToHM(dayData.breakTotalMs) : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {hasData ? formatDurationMsToHM(dayData.workTotalMs) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="h-7 px-2 sm:px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => openEditDialog(dateStr)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">編集</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
