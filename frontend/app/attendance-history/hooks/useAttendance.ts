import { useState, useEffect } from "react";
import { AttendanceRecord } from "../../../../shared/types/Attendance";
import { toJSTDateString } from "../../../lib/time";

export function useAttendance() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                setLoading(true);
                setError(null);

                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1;

                const res = await fetch(
                    `/api/attendance/month?year=${year}&month=${month}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch attendance");
                }

                const json = await res.json();

                // API の返却形式に合わせて整形
                const formatted: AttendanceRecord[] = json.map((day: any) => ({
                    id: day.id,
                    date: day.date, // "2025-11-24" など ISO 形式
                    sessions: day.sessions.map((s: any) => ({
                        id: s.id,
                        clockIn: s.clockIn,
                        clockOut: s.clockOut,
                        breaks: s.breaks.map((b: any) => ({
                            id: b.id,
                            start: b.start,
                            end: b.end,
                        })),
                    })),
                }));

                setAttendanceData(formatted);

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [currentMonth]);

    // ---------------------------
    // 選択している日のデータを取得
    // ---------------------------

    const selectedDayData = attendanceData.find((r) => r.date === toJSTDateString(selectedDate)) || null;

    return {
        attendanceData,
        selectedDayData,
        selectedDate,
        currentMonth,
        loading,
        error,
        setCurrentMonth,
        setSelectedDate,
    };
}