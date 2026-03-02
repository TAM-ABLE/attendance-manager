"use client"

import { useAsyncAction } from "@/hooks/useAsyncAction"
import { resetPassword } from "@/lib/api-services/admin"

export function usePasswordReset(onSuccess: () => void) {
  const { loading, error, clearError, run } = useAsyncAction()

  const submit = async (userId: string) => {
    const result = await run(() => resetPassword(userId))

    if (result.success) {
      onSuccess()
    }

    return result.success
  }

  return { submit, loading, error, clearError }
}
