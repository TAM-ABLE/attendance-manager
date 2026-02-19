import { formatClockTime, formatDurationMsToHM, getDateLabel, getWeekdayLabel } from "@/lib/time"
import type { FormattedAttendanceRecord } from "./formatters"

/**
 * 月次勤怠データをCSV形式のBufferとして生成（BOM付きUTF-8）
 */
export function generateMonthlyAttendanceCsv(
  monthDates: string[],
  records: FormattedAttendanceRecord[],
  userName: string,
): Buffer {
  const recordsByDate = new Map(records.map((r) => [r.date, r]))

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

  const getSessionTime = (
    sessions: FormattedAttendanceRecord["sessions"],
    index: number,
    type: "clockIn" | "clockOut",
  ) => {
    const session = sessions[index]
    if (!session) return "-"
    const time = session[type]
    return time ? formatClockTime(time) : "-"
  }

  const rows = monthDates.map((date) => {
    const record = recordsByDate.get(date)
    const sessions = record?.sessions ?? []
    const hasData = sessions.length > 0

    return [
      getDateLabel(date),
      getWeekdayLabel(date),
      getSessionTime(sessions, 0, "clockIn"),
      getSessionTime(sessions, 0, "clockOut"),
      getSessionTime(sessions, 1, "clockIn"),
      getSessionTime(sessions, 1, "clockOut"),
      getSessionTime(sessions, 2, "clockIn"),
      getSessionTime(sessions, 2, "clockOut"),
      hasData ? formatDurationMsToHM(record!.breakTotalMs) : "-",
      hasData ? formatDurationMsToHM(record!.workTotalMs) : "-",
    ]
  })

  const csvContent = [
    `"氏名: ${userName}"`,
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) => r.map((f) => `"${f}"`).join(",")),
  ].join("\n")

  const BOM = "\uFEFF"
  return Buffer.from(BOM + csvContent, "utf-8")
}
