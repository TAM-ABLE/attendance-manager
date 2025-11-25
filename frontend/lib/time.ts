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

export const formatTimeForCSV = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};