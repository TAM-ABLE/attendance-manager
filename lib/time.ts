// shared/lib/time.ts
// フロントエンド・バックエンド共通の時間ユーティリティ

// 定数
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE

// 曜日ラベル
const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const

/**
 * 現在時刻をJSTとして取得
 */
function nowJST(): Date {
  return new Date(Date.now() + JST_OFFSET_MS)
}

/**
 * 今日の日付をJSTでYYYY-MM-DD形式で取得
 */
export function todayJSTString(): string {
  const jst = nowJST()
  return jst.toISOString().split("T")[0]
}

/**
 * ミリ秒を「X時間Y分」形式に変換
 */
export function formatDurationMs(ms: number): string {
  const h = Math.floor(ms / MS_PER_HOUR)
  const m = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE)
  return `${h}時間${m}分`
}

/**
 * ミリ秒を「HH:MM」形式に変換
 */
export function formatDurationMsToHM(ms: number): string {
  const totalMinutes = Math.floor(ms / MS_PER_MINUTE)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  const pad = (n: number) => n.toString().padStart(2, "0")

  return `${pad(h)}:${pad(m)}`
}

/**
 * タイムスタンプを「HH:MM」形式に変換
 */
export function formatClockTime(timestamp: number | null | undefined): string {
  if (timestamp == null) return "--:--"

  const date = new Date(timestamp)
  const h = date.getHours().toString().padStart(2, "0")
  const m = date.getMinutes().toString().padStart(2, "0")

  return `${h}:${m}`
}

/**
 * 日付文字列と時刻文字列をタイムスタンプに結合
 * @param date "YYYY-MM-DD"
 * @param time "HH:MM"
 */
export function mergeDateAndTime(date: string | null, time: string): number | null {
  if (!date || !time) return null

  const [h, m] = time.split(":").map(Number)

  const d = new Date(date)
  d.setHours(h, m, 0, 0)

  return d.getTime()
}

/**
 * 日付文字列から曜日ラベルを取得 (日, 月, 火...)
 */
export function getWeekdayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return JP_WEEKDAYS[date.getDay()]
}

/**
 * 日付文字列からラベルを取得 (M月D日)
 */
export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * YYYY-MM形式の文字列をパースして年と月を取得
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } | null {
  const match = yearMonth.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  if (month < 1 || month > 12) return null

  return { year, month }
}

/**
 * 年と月からYYYY-MM形式の文字列を生成
 * @param year 年（4桁）
 * @param month 月（1-12）
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

/**
 * DateオブジェクトからYYYY-MM形式の文字列を生成
 */
export function formatYearMonthFromDate(date: Date): string {
  return formatYearMonth(date.getFullYear(), date.getMonth() + 1)
}

/**
 * 指定月の開始日と終了日をYYYY-MM-DD形式で返す
 * @param year 年（4桁）
 * @param month 月（1-12）
 */
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const mm = String(month).padStart(2, "0")
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  }
}

/**
 * 現在時刻をHH:mm形式で取得
 */
export function getCurrentTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

/**
 * HH:mm形式の時間をISO文字列に変換（今日の日付で）
 */
export function timeToISOString(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/**
 * 指定月の全日をYYYY-MM-DD形式の配列で返す
 * @param year 年（4桁）
 * @param month 月（1-12）
 */
export function generateMonthDates(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, "0")
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${year}-${mm}-${String(d).padStart(2, "0")}`)
  }
  return dates
}
