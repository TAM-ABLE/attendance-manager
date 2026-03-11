"use client"

import { useAsyncAction } from "@/hooks/useAsyncAction"
import { deleteUser } from "@/lib/api-services/admin"

export function useDeleteUser(onSuccess: () => void) {
  const { loading, error, clearError, run } = useAsyncAction()

  const submit = async (userId: string) => {
    const result = await run(() => deleteUser(userId))

    if (result.success) {
      onSuccess()
    }

    return result.success
  }

  return { submit, loading, error, clearError }
}
