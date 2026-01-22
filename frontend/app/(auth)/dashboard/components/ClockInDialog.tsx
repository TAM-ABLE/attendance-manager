// ClockInDialog.tsx
"use client"

import { DialogWrapper } from "@/components/DialogWrapper"
import { TaskListEditor } from "@/components/TaskListEditor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDialogState } from "@/hooks/useDialogState"
import { type TaskFormItem, createInitialTasks, toTasks } from "@/lib/task-form"
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse"
import type { Task } from "@attendance-manager/shared/types/Attendance"
import { useState } from "react"

interface ClockInDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (tasks: Task[], clockInTime?: string) => Promise<ApiResult<unknown>>
}

// 現在時刻をHH:mm形式で取得
function getCurrentTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

// HH:mm形式の時間をISO文字列に変換（今日の日付で）
function timeToISOString(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export const ClockInDialog = ({ open, onClose, onSubmit }: ClockInDialogProps) => {
  const [plannedTasks, setPlannedTasks] = useState<TaskFormItem[]>(createInitialTasks())
  const [clockInTime, setClockInTime] = useState(getCurrentTimeString())
  const { mode, error, handleSubmit, reset } = useDialogState()

  const onFormSubmit = async () => {
    await handleSubmit(() => onSubmit(toTasks(plannedTasks), timeToISOString(clockInTime)))
  }

  const handleClose = () => {
    reset()
    setPlannedTasks(createInitialTasks())
    setClockInTime(getCurrentTimeString())
    onClose()
  }

  return (
    <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={reset}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>出勤登録</DialogTitle>
            <DialogDescription>本日の予定を入力してください</DialogDescription>
          </DialogHeader>

          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clockInTime">出勤時間</Label>
              <Input
                id="clockInTime"
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                className="w-32"
              />
            </div>

            <TaskListEditor
              tasks={plannedTasks}
              onChange={setPlannedTasks}
              label="実施予定タスクと予定工数（時間）"
            />
          </div>

          <DialogFooter>
            <Button onClick={onFormSubmit}>送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
