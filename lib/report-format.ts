const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

/**
 * 提出日時のフォーマット（時刻のみ）
 */
export function formatSubmittedAtShort(timestamp: number | null): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * 提出日時のフォーマット（日付+時刻）
 */
export function formatSubmittedAt(timestamp: number | null): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getStatusDisplay(submittedAt: number | null): {
  label: string
  variant: "default" | "secondary"
} {
  return submittedAt !== null
    ? { label: "提出済", variant: "default" }
    : { label: "下書き", variant: "secondary" }
}

/** 日付文字列をJSTとしてパース（"2026-03-01" → JST midnight） */
function parseDateAsJST(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+09:00`)
}

export function formatReportDate(dateStr: string): string {
  const date = parseDateAsJST(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = JP_WEEKDAYS[date.getDay()]
  return `${month}/${day} (${weekday})`
}

export function formatReportDateLong(dateStr: string): string {
  const date = parseDateAsJST(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = JP_WEEKDAYS[date.getDay()]
  return `${year}年${month}月${day}日 (${weekday})`
}
