import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDurationMs } from "@attendance-manager/shared/lib/time"
import type { AttendanceRecord } from "@attendance-manager/shared/types/Attendance"

export function SummaryCard({ attendance }: { attendance: AttendanceRecord | null }) {
  if (!attendance || !attendance.sessions) return null

  const sessionCount = attendance.sessions.length

  // バックエンドで計算済みの値を使用
  const work = attendance.workTotalMs
  const breaks = attendance.breakTotalMs

  return (
    <Card>
      <CardHeader>
        <CardTitle>本日の勤務状況</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-2 sm:p-0">
            <p className="text-sm text-muted-foreground mb-1">勤務時間</p>
            <p className="text-xl sm:text-2xl">{formatDurationMs(work)}</p>
          </div>
          <div className="p-2 sm:p-0">
            <p className="text-sm text-muted-foreground mb-1">休憩時間</p>
            <p className="text-xl sm:text-2xl">{formatDurationMs(breaks)}</p>
          </div>
          <div className="p-2 sm:p-0">
            <p className="text-sm text-muted-foreground mb-1">セッション数</p>
            <p className="text-xl sm:text-2xl">{sessionCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
