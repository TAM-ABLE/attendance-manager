"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { toJSTDateString, formatYearMonth } from "@attendance-manager/shared/lib/time";
import { formatYearMonthFromDate } from "@attendance-manager/shared/lib/time";
import type { AttendanceRecord } from "@attendance-manager/shared/types/Attendance";
import { apiClient } from "@/lib/api-client";
import { withRetry } from "@/lib/auth/with-retry";
import { SWR_KEYS } from "@/lib/swr-keys";

function getMonth(year: number, month: number) {
    const yearMonth = formatYearMonth(year, month);
    return apiClient<AttendanceRecord[]>(`/attendance/month/${yearMonth}`);
}

export function useAttendanceHistory() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // SWRキーを生成
    const yearMonth = formatYearMonthFromDate(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // SWRでデータ取得（キャッシュ付き、401 時は自動リフレッシュ）
    const {
        data: attendanceData,
        error: swrError,
        isLoading: loading,
        mutate,
    } = useSWR(
        SWR_KEYS.attendanceMonth(yearMonth),
        async () => {
            const result = await withRetry(() => getMonth(year, month));
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
