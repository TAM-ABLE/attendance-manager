// frontend/components/DialogWrapper.tsx
// ダイアログの共通ラッパーコンポーネント

"use client"

import { Loader } from "@/components/Loader"
import { SuccessDialog } from "@/components/SuccessDialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { DialogMode } from "@/hooks/useDialogState"

interface DialogWrapperProps {
  open: boolean
  onClose: () => void
  mode: DialogMode
  onReset: () => void
  successTitle?: string
  successDescription?: string
  children: React.ReactNode
}

/**
 * ダイアログの共通ラッパー
 * loading/success状態の表示を共通化
 *
 * @example
 * <DialogWrapper
 *   open={open}
 *   onClose={onClose}
 *   mode={mode}
 *   onReset={reset}
 * >
 *   <DialogContent>...</DialogContent>
 * </DialogWrapper>
 */
export function DialogWrapper({
  open,
  onClose,
  mode,
  onReset,
  successTitle,
  successDescription,
  children,
}: DialogWrapperProps) {
  // Loading UI
  if (mode === "loading") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex justify-center py-12">
          <Loader size={50} border={4} />
        </DialogContent>
      </Dialog>
    )
  }

  // Success UI
  if (mode === "success") {
    return (
      <SuccessDialog
        open={open}
        title={successTitle}
        description={successDescription}
        onClose={() => {
          onReset()
          onClose()
        }}
      />
    )
  }

  // Form UI (children)
  return <>{children}</>
}
