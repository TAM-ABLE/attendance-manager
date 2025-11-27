//lib/time.ts
export const formatDurationMs = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}時間${m}分`;
};

export const formatClockTime = (timestamp?: number) => {
    if (!timestamp) return "--:--";
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getISOWeekNumber = (date: Date) => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7; // 日曜は7扱い

    // 週番号計算
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));

    return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};


export const formatTimeForCSV = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};