// hooks/useMonthlyAttendance.ts
"use client";

import { useEffect, useState } from "react";
import { DayAttendance, User } from "../../../../shared/types/Attendance";
import { getUserMonth } from "@/app/actions/get-user-month";

export function useMonthlyAttendance(user: User | null, date: Date) {
    const [monthData, setMonthData] = useState<DayAttendance[] | null>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            const data = await getUserMonth(user!.id, date.getFullYear(), date.getMonth());
            setMonthData(data);
        }

        fetchData();
    }, [user, date]);

    return { monthData, setMonthData };
}
