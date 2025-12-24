"use client";
// hooks/useEditDialog.ts

import { useState } from "react";
import { WorkSession, User } from "../../../../shared/types/Attendance";
import { updateUserDateSessions, getUserDateSessions } from "@/app/actions/admin";

export function useEditDialog(selectedUser: User | null, reloadMonthData: () => void) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sessions, setSessions] = useState<WorkSession[]>([]);

    const openDialog = async (date: string) => {
        if (!selectedUser) return;
        setSelectedDate(date);
        setSessions(await getUserDateSessions(selectedUser.id, date));
        setShowEditDialog(true);
    };

    const closeDialog = () => setShowEditDialog(false);

    const saveSessions = async () => {
        if (!selectedUser || !selectedDate) return;

        const res = await updateUserDateSessions(selectedUser.id, selectedDate, sessions);

        reloadMonthData();

        if (!res.success) {
            console.error("Update-work-sessions failed:", res.error);
            throw new Error(res.error);
        }
    };

    return { showEditDialog, selectedDate, sessions, setSessions, openDialog, closeDialog, saveSessions };
}
