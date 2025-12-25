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
        const result = await getUserDateSessions(selectedUser.id, date);
        if (result.success) {
            setSessions(result.data);
        } else {
            console.error("Failed to load sessions:", result.error.message);
            setSessions([]);
        }
        setShowEditDialog(true);
    };

    const closeDialog = () => setShowEditDialog(false);

    const saveSessions = async () => {
        if (!selectedUser || !selectedDate) return;

        const res = await updateUserDateSessions(selectedUser.id, selectedDate, sessions);

        reloadMonthData();

        if (!res.success) {
            console.error("Update-work-sessions failed:", res.error);
            throw new Error(res.error.message);
        }
    };

    return { showEditDialog, selectedDate, sessions, setSessions, openDialog, closeDialog, saveSessions };
}
