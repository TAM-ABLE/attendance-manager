"use client"

import { useAsyncAction } from "@/hooks/useAsyncAction"
import { resendInvite } from "@/lib/api-services/admin"

export function useResendInvite(onSuccess: () => void) {
  const { loading, error, clearError, run } = useAsyncAction()

  const submit = async (userId: string) => {
    const result = await run(() => resendInvite(userId))

    if (result.success) {
      onSuccess()
    }

    return result.success
  }

  return { submit, loading, error, clearError }
}
