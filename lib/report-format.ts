const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

export function getStatusDisplay(submittedAt: number | null): {
  label: string
  variant: "default" | "secondary"
} {
  return submittedAt !== null
    ? { label: "提出済", variant: "default" }
    : { label: "下書き", variant: "secondary" }
}

export function formatReportDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = JP_WEEKDAYS[date.getDay()]
  return `${month}/${day} (${weekday})`
}

export function formatReportDateLong(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = JP_WEEKDAYS[date.getDay()]
  return `${year}年${month}月${day}日 (${weekday})`
}
