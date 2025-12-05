import { useState, useEffect } from "react";
import { AttendanceRecord } from "../../../../shared/types/Attendance";
import { toJSTDateString } from "../../../lib/time";

export function useAttendance() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                setLoading(true);

                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1;

                const res = await fetch(
                    `/api/attendance/month?year=${year}&month=${month}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch attendance");
                }

                const data: AttendanceRecord[] = await res.json();

                setAttendanceData(data);

            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error("Error:", err.message);
                } else {
                    console.error("Unknown error:", err);
                }
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
        setCurrentMonth,
        setSelectedDate,
    };
}