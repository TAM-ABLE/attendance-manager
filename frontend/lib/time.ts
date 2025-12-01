//lib/time.ts

/**
 * UTCのDateをJST基準で YYYY-MM-DD 文字列に変換
 */
export const toJSTDateString = (date: Date | undefined): string => {
    if (!date) return "";

    // UTC → JST に変換
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    // YYYY-MM-DD 形式に整形
    const yyyy = jst.getUTCFullYear();
    const mm = (jst.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = jst.getUTCDate().toString().padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
};

export const formatDurationMs = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}時間${m}分`;
};

export const formatClockTime = (timestamp?: number) => {
    if (timestamp == null) return "--:--";

    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");

    return `${h}:${m}`;
};

// date: "YYYY-MM-DD"
// time: "HH:MM"
export const mergeDateAndTime = (date: string | null, time: string) => {
    if (!date || !time) return undefined;

    const [h, m] = time.split(":").map(Number);

    // YYYY-MM-DD を Date にする（ローカル扱い）
    const d = new Date(date);
    d.setHours(h, m, 0, 0);

    return d.getTime();
}

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