"use client"

import { useAsyncAction } from "@/hooks/useAsyncAction"
import { resendInvite, resetPassword } from "@/lib/api-services/admin"

export type EmailActionType = "resend-invite" | "password-reset"

export function useEmailAction(onSuccess: (message: string) => void) {
  const { loading, error, clearError, run } = useAsyncAction()

  const submit = async (userId: string, type: EmailActionType) => {
    const action = type === "resend-invite" ? resendInvite : resetPassword
    const result = await run(() => action(userId))

    if (result.success) {
      const message =
        type === "resend-invite"
          ? "招待メールを再送しました"
          : "パスワードリセットメールを送信しました"
      onSuccess(message)
    }

    return result.success
  }

  return { submit, loading, error, clearError }
}
