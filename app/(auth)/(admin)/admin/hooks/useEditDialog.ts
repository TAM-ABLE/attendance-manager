"use client"

import { useEditDialogBase } from "@/hooks/useEditDialogBase"
import { getUserDateSessions, updateUserDateSessions } from "@/lib/api-services/admin"
import { isValidUUID } from "@/lib/constants"
import type { User } from "@/types/Attendance"

export function useEditDialog(selectedUser: User | null, reloadMonthData: () => void) {
  const isUserValid = () => !!selectedUser?.id && isValidUUID(selectedUser.id)

  return useEditDialogBase(
    {
      fetchSessions: (date) => getUserDateSessions(selectedUser!.id, date),
      updateSessions: (date, sessions) => updateUserDateSessions(selectedUser!.id, date, sessions),
      canOpen: isUserValid,
      canSave: isUserValid,
      saveValidationError: "ユーザーまたは日付が無効です",
    },
    reloadMonthData,
  )
}
