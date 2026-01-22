"use client"
// hooks/useEditDialog.ts

import { apiClient } from "@/lib/api-client"
import { withRetry } from "@/lib/auth/with-retry"
import { isValidUUID } from "@attendance-manager/shared/lib/constants"
import type { User, WorkSession } from "@attendance-manager/shared/types/Attendance"
import { useState } from "react"

function getUserDateSessions(userId: string, date: string) {
  return apiClient<WorkSession[]>(`/admin/users/${userId}/attendance/${date}/sessions`)
}

function updateUserDateSessions(userId: string, date: string, sessions: WorkSession[]) {
  return apiClient<null>(`/admin/users/${userId}/attendance/${date}/sessions`, {
    method: "PUT",
    body: { sessions },
  })
}

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
