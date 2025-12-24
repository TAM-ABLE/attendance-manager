// hooks/useMonthlyAttendance.ts
"use client";

import { useEffect, useState } from "react";
import { AttendanceRecord, User } from "../../../../shared/types/Attendance";
import { getUserMonthlyAttendance } from "@/app/actions/admin";

export function useMonthlyAttendance(user: User | null, date: Date) {
    const [monthData, setMonthData] = useState<AttendanceRecord[] | null>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            const data = await getUserMonthlyAttendance(user!.id, date.getFullYear(), date.getMonth());
            setMonthData(data);
        }

        fetchData();
    }, [user, date]);

    return { monthData, setMonthData };
}
