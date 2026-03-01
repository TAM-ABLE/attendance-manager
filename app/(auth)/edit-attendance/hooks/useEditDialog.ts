"use client"

import { useEditDialogBase } from "@/hooks/useEditDialogBase"
import { getDateSessions, updateDateSessions } from "@/lib/api-services/attendance"

export function useEditDialog(reloadMonthData: () => void) {
  return useEditDialogBase(
    {
      fetchSessions: (date) => getDateSessions(date),
      updateSessions: (date, sessions) => updateDateSessions(date, sessions),
    },
    reloadMonthData,
  )
}
