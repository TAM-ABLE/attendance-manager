"use client"

import { useState } from "react"
import { withRetry } from "@/lib/auth/with-retry"
import type { ApiResult } from "@/types/ApiResponse"
import type { WorkSession } from "@/types/Attendance"

interface EditDialogConfig {
  fetchSessions: (date: string) => Promise<ApiResult<WorkSession[]>>
  updateSessions: (date: string, sessions: WorkSession[]) => Promise<ApiResult<unknown>>
  canOpen?: () => boolean
  canSave?: () => boolean
  saveValidationError?: string
}

export function useEditDialogBase(config: EditDialogConfig, reloadMonthData: () => void) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sessions, setSessions] = useState<WorkSession[]>([])

  const openDialog = async (date: string) => {
    if (config.canOpen && !config.canOpen()) return
    setSelectedDate(date)
    const result = await withRetry(() => config.fetchSessions(date))
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
    if (config.canSave && !config.canSave()) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: config.saveValidationError ?? "バリデーションエラー",
        },
      }
    }
    if (!selectedDate) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "日付が選択されていません" },
      }
    }

    const res = await withRetry(() => config.updateSessions(selectedDate, sessions))
    if (res.success) {
      reloadMonthData()
    }
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
