// hooks/useEditDialog.ts
"use client";

import { useState } from "react";
import { WorkSession, User } from "../../../../shared/types/Attendance";

export function useEditDialog(selectedUser: User | null, reloadMonthData: () => void) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sessions, setSessions] = useState<WorkSession[]>([]);

    const openDialog = async (date: string) => {
        setSelectedDate(date);

        const res = await fetch(
            `/api/attendance/get-user-date-work-sessions?userId=${selectedUser?.id}&date=${date}`
        );

        setSessions(await res.json());
        setShowEditDialog(true);
    };

    const closeDialog = () => setShowEditDialog(false);

    const saveSessions = async () => {
        await fetch("/api/attendance/update-user-date-work-sessions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: selectedUser?.id,
                date: selectedDate,
                sessions,
            }),
        });

        reloadMonthData();
        closeDialog();
    };

    return { showEditDialog, selectedDate, sessions, setSessions, openDialog, closeDialog, saveSessions };
}
