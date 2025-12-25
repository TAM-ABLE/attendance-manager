"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import type { AttendanceRecord } from "../../../../shared/types/Attendance";
import { toJSTDateString } from "../../../lib/time";
import { formatYearMonthFromDate } from "../../../../shared/lib/time";
import { getMonth } from "@/app/actions/attendance";
import { SWR_KEYS } from "@/lib/swr-keys";

export function useAttendanceHistory() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // SWRキーを生成
    const yearMonth = formatYearMonthFromDate(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // SWRでデータ取得（キャッシュ付き）
    const {
        data: attendanceData,
        error: swrError,
        isLoading: loading,
        mutate,
    } = useSWR(
        SWR_KEYS.attendanceMonth(yearMonth),
        async () => {
            const result = await getMonth(year, month);
            if (result.success) {
                return result.data;
            }
            throw new Error(result.error.message);
        },
        {
            // 5分間キャッシュ
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    // 選択している日のデータを取得
    const selectedDayData = useMemo(() => {
        if (!attendanceData) return null;
        return attendanceData.find((r) => r.date === toJSTDateString(selectedDate)) || null;
    }, [attendanceData, selectedDate]);

    return {
        attendanceData: attendanceData ?? [],
        selectedDayData,
        selectedDate,
        currentMonth,
        loading,
        error: swrError?.message ?? null,
        setCurrentMonth,
        setSelectedDate,
        refresh: () => mutate(),
    };
}
