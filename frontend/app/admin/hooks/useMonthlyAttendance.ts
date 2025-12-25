// hooks/useMonthlyAttendance.ts
"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { AttendanceRecord, User } from "../../../../shared/types/Attendance";
import { getUserMonthlyAttendance } from "@/app/actions/admin";

export function useMonthlyAttendance(user: User | null, date: Date) {
    const [monthData, setMonthData] = useState<AttendanceRecord[] | null>(null);

    const fetcher = useCallback(async () => {
        if (!user) return null;
        const result = await getUserMonthlyAttendance(user.id, date.getFullYear(), date.getMonth());
        if (result.success) {
            return result.data;
        }
        throw new Error(result.error.message);
    }, [user, date]);

    const { error, mutate } = useSWR(
        user ? ["monthlyAttendance", user.id, date.getFullYear(), date.getMonth()] : null,
        fetcher,
        {
            onSuccess: (data) => {
                setMonthData(data);
            },
            onError: (err) => {
                console.error("Failed to load monthly attendance:", err);
                setMonthData(null);
            },
        }
    );

    return {
        monthData,
        setMonthData,
        error: error?.message ?? null,
        refetch: () => mutate(),
    };
}
