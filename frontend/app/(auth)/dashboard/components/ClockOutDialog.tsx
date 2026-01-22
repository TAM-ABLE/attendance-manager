// ClockOutDialog.tsx
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
import { Textarea } from "@/components/ui/textarea"
import { useDialogState } from "@/hooks/useDialogState"
import { type TaskFormItem, createInitialTasks, toTasks } from "@/lib/task-form"
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse"
import type { Task } from "@attendance-manager/shared/types/Attendance"
import { useState } from "react"

interface ClockOutDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    actualTasks: Task[],
    summary: string,
    issues: string,
    notes: string,
    clockOutTime?: string,
  ) => Promise<ApiResult<unknown>>
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

export const ClockOutDialog = ({ open, onClose, onSubmit }: ClockOutDialogProps) => {
  const [actualTasks, setActualTasks] = useState<TaskFormItem[]>(createInitialTasks())
  const [summary, setSummary] = useState<string>("")
  const [issues, setIssues] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [clockOutTime, setClockOutTime] = useState(getCurrentTimeString())
  const { mode, error, handleSubmit, reset } = useDialogState()

  const onFormSubmit = async () => {
    await handleSubmit(() =>
      onSubmit(toTasks(actualTasks), summary, issues, notes, timeToISOString(clockOutTime)),
    )
  }

  const handleClose = () => {
    reset()
    setActualTasks(createInitialTasks())
    setSummary("")
    setIssues("")
    setNotes("")
    setClockOutTime(getCurrentTimeString())
    onClose()
  }

  return (
    <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={reset}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>退勤登録</DialogTitle>
            <DialogDescription>本日の業務報告を入力してください</DialogDescription>
          </DialogHeader>

          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clockOutTime">退勤時間</Label>
              <Input
                id="clockOutTime"
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="w-32"
              />
            </div>

            <TaskListEditor
              tasks={actualTasks}
              onChange={setActualTasks}
              label="実施タスクと実工数（時間）"
            />

            <div>
              <Label htmlFor="summary">本日のまとめ（感想・気づき）</Label>
              <Textarea
                id="summary"
                placeholder="本日の業務についての感想や気づきを入力..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>

            <div>
              <Label htmlFor="issues">困っていること・相談したいこと</Label>
              <Textarea
                id="issues"
                placeholder="困っていることや相談したいことがあれば入力..."
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>

            <div>
              <Label htmlFor="notes">連絡事項</Label>
              <Textarea
                id="notes"
                placeholder="連絡事項があれば入力..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onFormSubmit}>送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
