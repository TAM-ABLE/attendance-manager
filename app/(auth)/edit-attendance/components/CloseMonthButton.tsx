"use client"

import { useState } from "react"
import { DialogWrapper } from "@/components/DialogWrapper"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDialogState } from "@/hooks/useDialogState"
import { closeMonth } from "@/lib/api-services/attendance"
import { withRetry } from "@/lib/auth/with-retry"

interface CloseMonthButtonProps {
  yearMonth: string
  year: number
  month: number
}

export function CloseMonthButton({ yearMonth, year, month }: CloseMonthButtonProps) {
  const [open, setOpen] = useState(false)
  const { mode, error, handleSubmit, reset } = useDialogState()

  const onConfirm = async () => {
    await handleSubmit(() => withRetry(() => closeMonth(yearMonth)))
  }

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>勤怠を締める</Button>

      <DialogWrapper
        open={open}
        onClose={handleClose}
        mode={mode}
        onReset={reset}
        successTitle="送信完了"
        successDescription={`${year}年${month}月の勤怠CSVをSlackに送信しました。`}
      >
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>勤怠を締める</DialogTitle>
              <DialogDescription>
                {year}年{month}月の勤怠データをCSVとしてSlackに送信します。よろしいですか？
              </DialogDescription>
            </DialogHeader>

            {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button onClick={onConfirm}>送信</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogWrapper>
    </>
  )
}
