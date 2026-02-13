"use client"

// hooks/useEditDialog.ts

import { useState } from "react"
import { getUserDateSessions, updateUserDateSessions } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import { isValidUUID } from "@/lib/constants"
import type { ApiResult } from "@/types/ApiResponse"
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

  const saveSessions = async (): Promise<ApiResult<unknown>> => {
    if (!selectedUser || !selectedUser.id || !isValidUUID(selectedUser.id) || !selectedDate) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "ユーザーまたは日付が無効です" },
      }
    }

    const res = await withRetry(() =>
      updateUserDateSessions(selectedUser.id, selectedDate, sessions),
    )
    reloadMonthData()
    return res
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
