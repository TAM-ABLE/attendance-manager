// shared/lib/time.ts
// フロントエンド・バックエンド共通の時間ユーティリティ

// 定数
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;

// 曜日ラベル
const JP_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 現在時刻をJSTとして取得
 */
export function nowJST(): Date {
    return new Date(Date.now() + JST_OFFSET_MS);
}

/**
 * UTCのDateをJSTに変換
 */
export function toJST(date: Date): Date {
    return new Date(date.getTime() + JST_OFFSET_MS);
}

/**
 * 今日の日付をJSTでYYYY-MM-DD形式で取得
 */
export function todayJSTString(): string {
    const jst = nowJST();
    return jst.toISOString().split("T")[0];
}

/**
 * UTCのDateをJST基準で YYYY-MM-DD 文字列に変換
 */
export function toJSTDateString(date: Date | undefined): string {
    if (!date) return "";

    const jst = toJST(date);

    const yyyy = jst.getUTCFullYear();
    const mm = (jst.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = jst.getUTCDate().toString().padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

/**
 * JSTとして扱うDateをYYYY-MM-DD形式に変換
 */
export function formatJSTDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * ミリ秒を「X時間Y分」形式に変換
 */
export function formatDurationMs(ms: number): string {
    const h = Math.floor(ms / MS_PER_HOUR);
    const m = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
    return `${h}時間${m}分`;
}

/**
 * ミリ秒を「HH:MM」形式に変換
 */
export function formatDurationMsToHM(ms: number): string {
    const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(h)}:${pad(m)}`;
}

/**
 * タイムスタンプを「HH:MM」形式に変換
 */
export function formatClockTime(timestamp: number | null | undefined): string {
    if (timestamp == null) return "--:--";

    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");

    return `${h}:${m}`;
}

/**
 * 日付文字列と時刻文字列をタイムスタンプに結合
 * @param date "YYYY-MM-DD"
 * @param time "HH:MM"
 */
export function mergeDateAndTime(date: string | null, time: string): number | null {
    if (!date || !time) return null;

    const [h, m] = time.split(":").map(Number);

    const d = new Date(date);
    d.setHours(h, m, 0, 0);

    return d.getTime();
}

/**
 * 日付文字列から曜日ラベルを取得 (日, 月, 火...)
 */
export function getWeekdayLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return JP_WEEKDAYS[date.getDay()];
}

/**
 * 日付文字列からラベルを取得 (M月D日)
 */
export function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * YYYY-MM形式の文字列をパースして年と月を取得
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } | null {
    const match = yearMonth.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);

    if (month < 1 || month > 12) return null;

    return { year, month };
}

/**
 * 指定した年月が現在の年月かどうかを判定
 */
export function isCurrentMonth(year: number, month: number): boolean {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() + 1 === month;
}

/**
 * 年と月からYYYY-MM形式の文字列を生成
 * @param year 年（4桁）
 * @param month 月（1-12）
 */
export function formatYearMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * DateオブジェクトからYYYY-MM形式の文字列を生成
 */
export function formatYearMonthFromDate(date: Date): string {
    return formatYearMonth(date.getFullYear(), date.getMonth() + 1);
}
