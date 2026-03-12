// ClockOutDialog.tsx
"use client"

import useSWR from "swr"
import { DialogWrapper } from "@/components/DialogWrapper"
import { FormError } from "@/components/FormError"
import { Loader } from "@/components/Loader"
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
import { Textarea } from "@/components/ui/textarea"
import { useDialogState } from "@/hooks/useDialogState"
import {
  getTodayPlannedTasks,
  getTodayPreviousActuals,
  getTodayReportSummary,
} from "@/lib/api-services/attendance"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import { fromPlannedTask, toTasks } from "@/lib/task-form"
import { timeToISOString } from "@/lib/time"
import type { ApiResult } from "@/types/ApiResponse"
import type { Task } from "@/types/Attendance"
import { useClockOutForm } from "../hooks/useClockOutForm"
import { useTaskList } from "../hooks/useTaskList"
import { TaskListInput } from "./TaskListInput"

interface ClockOutDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    actualTasks: Task[],
    summary: string,
    issues: string,
    notes: string,
    clockOutTime?: string,
  ) => Promise<ApiResult<{ slackTs?: string }>>
}

export const ClockOutDialog = ({ open, onClose, onSubmit }: ClockOutDialogProps) => {
  const form = useClockOutForm()
  const { mode, error, handleSubmit, reset: resetDialog } = useDialogState()
  const taskList = useTaskList()

  // ダイアログが開いたとき、現在セッションの予定タスクをSWRで取得
  const { isLoading: isFetching, error: fetchError } = useSWR(
    open ? SWR_KEYS.PLANNED_TASKS_TODAY : null,
    () => withRetryFetcher(getTodayPlannedTasks),
    {
      onSuccess: (data) => {
        if (data.length > 0) {
          taskList.setTasks(data.map(fromPlannedTask))
        }
      },
      revalidateOnFocus: false,
    },
  )

  // 過去セッションの実績タスクを取得（読み取り専用表示用）
  const { data: previousActuals } = useSWR(
    open ? SWR_KEYS.PREVIOUS_ACTUALS_TODAY : null,
    () => withRetryFetcher(getTodayPreviousActuals),
    { revalidateOnFocus: false },
  )

  const hasPreviousActuals = previousActuals && previousActuals.length > 0

  // 前回退勤時のサマリー・所感を取得して引き継ぎ表示
  useSWR(
    open ? SWR_KEYS.REPORT_SUMMARY_TODAY : null,
    () => withRetryFetcher(getTodayReportSummary),
    {
      onSuccess: (data) => {
        if (data) {
          form.setSummary(data.summary ?? "")
          form.setIssues(data.issues ?? "")
          form.setNotes(data.notes ?? "")
        }
      },
      revalidateOnFocus: false,
    },
  )

  const onFormSubmit = async () => {
    if (!taskList.validate()) return
    const allTasks: Task[] = toTasks(taskList.tasks)
    await handleSubmit(() =>
      onSubmit(allTasks, form.summary, form.issues, form.notes, timeToISOString(form.clockOutTime)),
    )
  }

  const handleClose = () => {
    resetDialog()
    taskList.reset()
    form.reset()
    onClose()
  }

  return (
    <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={resetDialog}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>退勤登録</DialogTitle>
            <DialogDescription>本日の業務報告を入力してください</DialogDescription>
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
          {fetchError && <FormError message="予定タスクの取得に失敗しました" />}

          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader />
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <TimeInput
                  id="clockOutTime"
                  label="退勤時間"
                  value={form.clockOutTime}
                  onChange={form.setClockOutTime}
                />

                <div>
                  <Label className="text-base">予定タスクの実績入力</Label>
                  <div className="mt-3">
                    <TaskListInput taskList={taskList} />
                  </div>
                </div>

                {hasPreviousActuals && (
                  <>
                    <div className="border-t" />
                    <div className="rounded-md border border-muted bg-muted/30 p-3">
                      <Label className="text-sm text-muted-foreground">
                        本日登録済みのタスク実績
                      </Label>
                      <ul className="mt-2 space-y-1 text-sm">
                        {previousActuals.map((task) => (
                          <li
                            key={`prev-${task.taskName}-${task.hours}`}
                            className="flex justify-between"
                          >
                            <span>{task.taskName}</span>
                            <span className="text-muted-foreground">
                              {task.hours != null ? `${task.hours}h` : "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="summary">本日のまとめ（感想・気づき）</Label>
                  <Textarea
                    id="summary"
                    placeholder="本日の業務についての感想や気づきを入力..."
                    value={form.summary}
                    onChange={(e) => form.setSummary(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="issues">困っていること・相談したいこと</Label>
                  <Textarea
                    id="issues"
                    placeholder="困っていることや相談したいことがあれば入力..."
                    value={form.issues}
                    onChange={(e) => form.setIssues(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">連絡事項</Label>
                  <Textarea
                    id="notes"
                    placeholder="連絡事項があれば入力..."
                    value={form.notes}
                    onChange={(e) => form.setNotes(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={onFormSubmit} disabled={mode === "loading"}>
                  送信
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DialogWrapper>
  )
}
