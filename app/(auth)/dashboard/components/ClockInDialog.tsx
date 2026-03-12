// ClockInDialog.tsx
"use client"

import { useState } from "react"
import { DialogWrapper } from "@/components/DialogWrapper"
import { FormError } from "@/components/FormError"
import { TimeInput } from "@/components/TimeInput"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useDialogState } from "@/hooks/useDialogState"
import { toTasks } from "@/lib/task-form"
import { getCurrentTimeString, timeToISOString } from "@/lib/time"
import type { ApiResult } from "@/types/ApiResponse"
import type { Task } from "@/types/Attendance"
import { useTaskList } from "../hooks/useTaskList"
import { TaskChipSelector } from "./TaskChipSelector"
import { TaskListInput } from "./TaskListInput"

interface ClockInDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (tasks: Task[], clockInTime?: string) => Promise<ApiResult<{ slackTs?: string }>>
}

export const ClockInDialog = ({ open, onClose, onSubmit }: ClockInDialogProps) => {
  const [clockInTime, setClockInTime] = useState(getCurrentTimeString())
  const { mode, error, handleSubmit, reset: resetDialog } = useDialogState()
  const taskList = useTaskList()

  const onFormSubmit = async () => {
    if (!taskList.validate()) return
    await handleSubmit(() => onSubmit(toTasks(taskList.tasks), timeToISOString(clockInTime)))
  }

  const handleClose = () => {
    resetDialog()
    taskList.reset()
    setClockInTime(getCurrentTimeString())
    onClose()
  }

  return (
    <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={resetDialog}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>出勤登録</DialogTitle>
            <DialogDescription>本日の予定を入力してください</DialogDescription>
          </DialogHeader>

          {error && <FormError message={error} />}
          {taskList.hasValidated && taskList.hasTaskError && (
            <FormError
              message={
                taskList.tasks.length === 0
                  ? "タスクを1つ以上追加してください"
                  : "タスク名を入力するか、不要な行を削除してください"
              }
            />
          )}

          <div className="space-y-4 py-4">
            <TimeInput
              id="clockInTime"
              label="出勤時間"
              value={clockInTime}
              onChange={setClockInTime}
            />

            <div>
              <Label className="text-base">実施予定タスクと予定工数（時間）</Label>
              <div className="space-y-3 mt-3">
                <TaskChipSelector
                  selectedTaskNames={taskList.selectedTaskNames}
                  onToggle={taskList.toggleChip}
                />
                <div className="border-t pt-3">
                  <TaskListInput taskList={taskList} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onFormSubmit} disabled={mode === "loading"}>
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
