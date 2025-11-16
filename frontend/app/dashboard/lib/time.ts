import { loadAttendance } from "../lib/storage";

export const formatTime = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}時間${m}分`;
};

export const formatWeeklyHours = (hours: number) => {
    return `${Math.floor(hours)}時間${Math.round((hours % 1) * 60)}分`;
};

export const calcWeeklyHours = () => {
    const today = new Date();

    // 今週の月曜日を算出
    const day = today.getDay(); // 0:日曜,1:月曜,...
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    // 上記は日曜→6日前, 月曜→0日前, 火曜→1日前... となる式

    let total = 0;

    // 月曜〜金曜（5日間）をループ
    for (let i = 0; i < 5; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        const key = date.toISOString().split("T")[0]; // yyyy-mm-dd
        const record = loadAttendance(key);
        if (!record) continue;

        record.sessions.forEach((s) => {
            if (!s.clockOut) return;

            const work = s.clockOut - s.clockIn;
            const breaks = s.breaks.reduce(
                (sum, b) => sum + (b.end ? b.end - b.start : 0),
                0
            );

            total += (work - breaks) / (1000 * 60 * 60);
        });
    }

    return total;
};