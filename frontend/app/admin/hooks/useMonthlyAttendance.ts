// hooks/useMonthlyAttendance.ts
"use client";

import { useEffect, useState } from "react";
import { DayAttendance, User } from "../../../../shared/types/Attendance";

export function useMonthlyAttendance(user: User | null, date: Date) {
    const [monthData, setMonthData] = useState<DayAttendance[] | null>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            const res = await fetch(
                `/api/attendance/user-month?userId=${user?.id}&year=${date.getFullYear()}&month=${date.getMonth()}`
            );
            const data: DayAttendance[] = await res.json();
            setMonthData(data);
        }

        fetchData();
    }, [user, date]);

    return { monthData, setMonthData };
}
