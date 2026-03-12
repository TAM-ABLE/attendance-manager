"use client"

import { FormError } from "@/components/FormError"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useEmailAction } from "../hooks/useEmailAction"

export type EmailAction = {
  userId: string
  userName: string
  type: "resend-invite" | "password-reset"
}

type EmailActionConfirmDialogProps = {
  action: EmailAction | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function EmailActionConfirmDialog({
  action,
  onClose,
  onSuccess,
}: EmailActionConfirmDialogProps) {
  const { submit, loading, error, clearError } = useEmailAction((message) => {
    onClose()
    onSuccess(message)
  })

  const handleConfirm = async () => {
    if (!action) return
    await submit(action.userId, action.type)
  }

  const handleCancel = () => {
    clearError()
    onClose()
  }

  return (
    <AlertDialog open={!!action} onOpenChange={(open: boolean) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action?.type === "resend-invite" ? "招待メール再送" : "パスワードリセット"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action?.type === "resend-invite"
              ? `${action.userName} に招待メールを再送します。よろしいですか？`
              : `${action?.userName} にパスワードリセットメールを送信します。よろしいですか？`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormError message={error} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "送信中..." : "送信"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
