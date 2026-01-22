import {
  formatClockTime,
  formatDurationMsToHM,
  getDateLabel,
  getWeekdayLabel,
} from "@attendance-manager/shared/lib/time"
// lib/exportCsv.ts
import type { AttendanceRecord } from "@attendance-manager/shared/types/Attendance"

export const exportMonthlyAttendanceCSV = (monthData: AttendanceRecord[], userName: string) => {
  // CSVヘッダー
  const headers = [
    "日付",
    "曜日",
    "出勤時刻1",
    "退勤時刻1",
    "出勤時刻2",
    "退勤時刻2",
    "出勤時刻3",
    "退勤時刻3",
    "休憩合計",
    "合計勤務時間",
  ]

  // 各セッションの出退勤時刻を取得するヘルパー
  const getSessionTime = (
    sessions: AttendanceRecord["sessions"],
    index: number,
    type: "clockIn" | "clockOut",
  ) => {
    const session = sessions[index]
    if (!session) return "-"
    const time = session[type]
    return time ? formatClockTime(time) : "-"
  }

  // CSVの行を作成
  const rows = monthData.map((d) => {
    const hasData = d.sessions.length > 0
    const dateLabel = getDateLabel(d.date)
    const weekday = getWeekdayLabel(d.date)

    return [
      dateLabel,
      weekday,
      getSessionTime(d.sessions, 0, "clockIn"),
      getSessionTime(d.sessions, 0, "clockOut"),
      getSessionTime(d.sessions, 1, "clockIn"),
      getSessionTime(d.sessions, 1, "clockOut"),
      getSessionTime(d.sessions, 2, "clockIn"),
      getSessionTime(d.sessions, 2, "clockOut"),
      hasData ? formatDurationMsToHM(d.breakTotalMs) : "-",
      hasData ? formatDurationMsToHM(d.workTotalMs) : "-",
    ]
  })

  // CSV文字列を結合
  const csvContent = [
    `"氏名: ${userName}"`,
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) => r.map((f) => `"${f}"`).join(",")),
  ].join("\n")

  // BOM付きBlobを作る（Excelで文字化け防止）
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${userName}_attendance.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
