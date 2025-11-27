import { AttendanceRecord, WorkSession } from "../../shared/types/Attendance";
import { getISOWeekNumber } from "@/lib/time";

/**
 * セッション単位（1回の出勤〜退勤）の労働時間（ms）
 */
export const calculateSessionWorkHours = (s: WorkSession) => {
    if (!s.clockIn || !s.clockOut) return 0;

    const work = s.clockOut - s.clockIn; // 出勤〜退勤の ms
    const breaks = s.breaks.reduce(
        (sum, b) => (b.end ? sum + (b.end - b.start) : sum),
        0
    );

    // ミリ秒で返す
    return Math.max(0, work - breaks);
};

/**
 * 1日の総労働時間（ms）
 */
export const calculateDayWorkHours = (sessions: WorkSession[]) => {
    return sessions.reduce((sum, session) => {
        return sum + calculateSessionWorkHours(session);
    }, 0);
};

/**
 * 今週の総労働時間（ms）
 */
export const calculateWeekWorkHours = (attendances: AttendanceRecord[]) => {
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const currentWeek = getISOWeekNumber(today);

    let total = 0;

    for (const attendance of attendances) {
        const date = new Date(attendance.date);
        const year = date.getUTCFullYear();
        const week = getISOWeekNumber(date);

        if (year === currentYear && week === currentWeek) {
            total += calculateDayWorkHours(attendance.sessions);
        }
    }

    return total; // ミリ秒
};

/**
 * 今月の総労働時間（ms）
 */
export const calculateMonthWorkHours = (attendances: AttendanceRecord[]) => {
    return attendances.reduce((sum, attendance) => {
        return sum + calculateDayWorkHours(attendance.sessions);
    }, 0);
};