import { AttendanceRecord } from "../types";

export const formatTime = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}時間${m}分`;
};

export const formatWeeklyHours = (hours: number) => {
    return `${Math.floor(hours)}時間${Math.round((hours % 1) * 60)}分`;
};

export const calcWeeklyHours = () => {
    let total = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const saved = localStorage.getItem(`attendance_${date.toDateString()}`);
        if (!saved) continue;
        const record: AttendanceRecord = JSON.parse(saved);
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