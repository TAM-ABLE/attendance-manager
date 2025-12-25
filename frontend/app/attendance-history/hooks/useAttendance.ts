"use client";

import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord } from "../../../../shared/types/Attendance";
import { toJSTDateString } from "../../../lib/time";
import { getMonth } from "@/app/actions/attendance";

export function useAttendance() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;

            const result = await getMonth(year, month);

            if (result.success) {
                setAttendanceData(result.data);
            } else {
                console.error("Failed to fetch attendance:", result.error);
                setError(result.error.message);
                setAttendanceData([]);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error("Error fetching attendance:", message);
            setError(message);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    // 選択している日のデータを取得
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
        refresh: fetchAttendance,
    };
}
