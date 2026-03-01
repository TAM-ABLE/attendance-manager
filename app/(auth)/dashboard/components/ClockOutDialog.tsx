// ClockOutDialog.tsx
"use client"

import { X } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"
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
import { getTodayPlannedTasks } from "@/lib/api-services/attendance"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import { fromPlannedTask, type TaskFormItem, toTasks } from "@/lib/task-form"
import { getCurrentTimeString, timeToISOString } from "@/lib/time"
import type { ApiResult } from "@/types/ApiResponse"
import type { Task } from "@/types/Attendance"

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

export const ClockOutDialog = ({ open, onClose, onSubmit }: ClockOutDialogProps) => {
  const [plannedTasks, setPlannedTasks] = useState<TaskFormItem[]>([])
  const [extraTasks, setExtraTasks] = useState<TaskFormItem[]>([])
  const [summary, setSummary] = useState<string>("")
  const [issues, setIssues] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [clockOutTime, setClockOutTime] = useState(getCurrentTimeString())
  const { mode, error, handleSubmit, reset } = useDialogState()

  // ダイアログが開いたとき、出勤時の予定タスクをSWRで取得
  const { error: fetchError } = useSWR(
    open ? SWR_KEYS.PLANNED_TASKS_TODAY : null,
    () => withRetryFetcher(getTodayPlannedTasks),
    {
      onSuccess: (data) => {
        if (data.length > 0) {
          setPlannedTasks(data.map(fromPlannedTask))
        }
      },
      revalidateOnFocus: false,
    },
  )

  const updatePlannedHours = (index: number, value: string) => {
    const updated = [...plannedTasks]
    updated[index] = { ...updated[index], hours: value }
    setPlannedTasks(updated)
  }

  const removePlannedTask = (index: number) => {
    setPlannedTasks(plannedTasks.filter((_, i) => i !== index))
  }

  const onFormSubmit = async () => {
    const allTasks: Task[] = [...toTasks(plannedTasks), ...toTasks(extraTasks)]
    await handleSubmit(() =>
      onSubmit(allTasks, summary, issues, notes, timeToISOString(clockOutTime)),
    )
  }

  const handleClose = () => {
    reset()
    setPlannedTasks([])
    setExtraTasks([])
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
          {fetchError && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              予定タスクの取得に失敗しました
            </div>
          )}

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

            {plannedTasks.length > 0 && (
              <div>
                <Label className="text-base">予定タスクの実績入力</Label>
                <div className="space-y-3 mt-3">
                  {plannedTasks.map((task, index) => (
                    <div key={task.id} className="flex gap-2 items-start">
                      <div className="flex-1 flex items-center min-h-9 px-3 rounded-md border bg-muted/50 text-sm">
                        {task.taskName}
                      </div>
                      <div className="w-28">
                        <Input
                          type="time"
                          value={task.hours}
                          onChange={(e) => updatePlannedHours(index, e.target.value)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removePlannedTask(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <TaskListEditor tasks={extraTasks} onChange={setExtraTasks} label="追加タスク" />

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
            <Button onClick={onFormSubmit} disabled={mode === "loading"}>
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
