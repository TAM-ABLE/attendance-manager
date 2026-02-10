"use client"

// hooks/useEditDialog.ts

import { useState } from "react"
import { getUserDateSessions, updateUserDateSessions } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import { isValidUUID } from "@/lib/constants"
import type { User, WorkSession } from "@/types/Attendance"

export function useEditDialog(selectedUser: User | null, reloadMonthData: () => void) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sessions, setSessions] = useState<WorkSession[]>([])

  const openDialog = async (date: string) => {
    // selectedUserまたはそのidが無効な場合はAPIを呼び出さない
    if (!selectedUser || !selectedUser.id || !isValidUUID(selectedUser.id)) return
    setSelectedDate(date)
    const result = await withRetry(() => getUserDateSessions(selectedUser.id, date))
    if (result.success) {
      setSessions(result.data)
    } else {
      console.error("Failed to load sessions:", result.error.message)
      setSessions([])
    }
    setShowEditDialog(true)
  }

  const closeDialog = () => setShowEditDialog(false)

  const saveSessions = async () => {
    if (!selectedUser || !selectedUser.id || !isValidUUID(selectedUser.id) || !selectedDate) return

    const res = await withRetry(() =>
      updateUserDateSessions(selectedUser.id, selectedDate, sessions),
    )

    reloadMonthData()

    if (!res.success) {
      console.error("Update-work-sessions failed:", res.error)
      throw new Error(res.error.message)
    }
  }

  return {
    showEditDialog,
    selectedDate,
    sessions,
    setSessions,
    openDialog,
    closeDialog,
    saveSessions,
  }
}
