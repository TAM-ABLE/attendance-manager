"use client"

import { useState } from "react"
import { DialogWrapper } from "@/components/DialogWrapper"
import { TimeInput } from "@/components/TimeInput"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDialogState } from "@/hooks/useDialogState"
import { getCurrentTimeString, timeToISOString } from "@/lib/time"
import type { ApiResult } from "@/types/ApiResponse"

interface BreakDialogProps {
  open: boolean
  mode: "start" | "end"
  onClose: () => void
  onStart: (breakStartTime?: string) => Promise<ApiResult<unknown>>
  onEnd: (breakEndTime?: string) => Promise<ApiResult<unknown>>
}

export const BreakDialog = ({ open, mode, onClose, onStart, onEnd }: BreakDialogProps) => {
  const [breakTime, setBreakTime] = useState(getCurrentTimeString())
  const { mode: dialogMode, error, handleSubmit, reset } = useDialogState()

  const onFormSubmit = async () => {
    const isoTime = timeToISOString(breakTime)
    await handleSubmit(() => (mode === "start" ? onStart(isoTime) : onEnd(isoTime)))
  }

  const handleClose = () => {
    reset()
    setBreakTime(getCurrentTimeString())
    onClose()
  }

  return (
    <DialogWrapper open={open} onClose={handleClose} mode={dialogMode} onReset={reset}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "start" ? "休憩開始" : "休憩終了"}</DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

          <div className="space-y-4 py-4">
            <TimeInput
              id="breakTime"
              label={mode === "start" ? "休憩開始時間" : "休憩終了時間"}
              value={breakTime}
              onChange={setBreakTime}
            />
          </div>

          <DialogFooter>
            <Button onClick={onFormSubmit} disabled={dialogMode === "loading"}>
              {mode === "start" ? "開始" : "終了"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
