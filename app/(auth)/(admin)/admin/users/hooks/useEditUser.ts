"use client"

import { useAsyncAction } from "@/hooks/useAsyncAction"
import { updateUser } from "@/lib/api-services/admin"

type EditUserForm = {
  lastName: string
  firstName: string
  email: string
}

export function useEditUser(onSuccess: () => void) {
  const { loading, error, clearError, run } = useAsyncAction()

  const submit = async (userId: string, form: EditUserForm) => {
    const result = await run(() => updateUser(userId, form))

    if (result.success) {
      onSuccess()
    }

    return result.success
  }

  return { submit, loading, error, clearError }
}
