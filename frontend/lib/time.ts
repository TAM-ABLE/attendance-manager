// frontend/lib/time.ts
// 後方互換性のため shared/lib/time から再エクスポート

export {
    // 定数
    JST_OFFSET_MS,
    MS_PER_SECOND,
    MS_PER_MINUTE,
    MS_PER_HOUR,
    // 関数
    nowJST,
    toJST,
    todayJSTString,
    toJSTDateString,
    formatJSTDate,
    formatDurationMs,
    formatDurationMsToHM,
    formatClockTime,
    mergeDateAndTime,
    getWeekdayLabel,
    getDateLabel,
    parseYearMonth,
    isCurrentMonth,
} from "../../shared/lib/time";
