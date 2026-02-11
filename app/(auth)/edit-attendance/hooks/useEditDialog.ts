"use client"

import { useState } from "react"
import { getDateSessions, updateDateSessions } from "@/lib/api-services/attendance"
import { withRetry } from "@/lib/auth/with-retry"
import type { WorkSession } from "@/types/Attendance"

export function useEditDialog(reloadMonthData: () => void) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sessions, setSessions] = useState<WorkSession[]>([])

  const openDialog = async (date: string) => {
    setSelectedDate(date)
    const result = await withRetry(() => getDateSessions(date))
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
    if (!selectedDate) return

    const res = await withRetry(() => updateDateSessions(selectedDate, sessions))

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
