// hooks/useMonthlyAttendance.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { AttendanceRecord, User } from "../../../../shared/types/Attendance";
import { getUserMonthlyAttendance } from "@/app/actions/admin";

export function useMonthlyAttendance(user: User | null, date: Date) {
    const [monthData, setMonthData] = useState<AttendanceRecord[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) {
            setMonthData(null);
            return;
        }
        const result = await getUserMonthlyAttendance(user.id, date.getFullYear(), date.getMonth());
        if (result.success) {
            setMonthData(result.data);
            setError(null);
        } else {
            console.error("Failed to load monthly attendance:", result.error.message);
            setMonthData(null);
            setError(result.error.message);
        }
    }, [user, date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { monthData, setMonthData, error, refetch: fetchData };
}
