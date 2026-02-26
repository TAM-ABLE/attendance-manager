// components/ClockOutTaskEditor.tsx
// 退勤登録用タスク編集コンポーネント
// 出勤時の予定タスクを参照しつつ実工数を入力する

"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type ActualTaskItem, createEmptyTask, type TaskFormItem } from "@/lib/task-form"

interface ClockOutTaskEditorProps {
  label: string
  /** 出勤時の予定タスク */
  plannedTasks: ActualTaskItem[]
  onChangePlanned: (tasks: ActualTaskItem[]) => void
  /** 予定外タスク */
  extraTasks: TaskFormItem[]
  onChangeExtra: (tasks: TaskFormItem[]) => void
}

/**
 * 退勤タスク編集コンポーネント
 * - 上部：出勤時の予定タスクを出勤登録と同じ行スタイルで表示し、実工数を入力・削除できる
 * - 下部：予定外タスクを追加できる
 */
export function ClockOutTaskEditor({
  label,
  plannedTasks,
  onChangePlanned,
  extraTasks,
  onChangeExtra,
}: ClockOutTaskEditorProps) {
  // ===== 予定タスク操作 =====

  const updatePlannedTaskName = (index: number, value: string) => {
    const updated = [...plannedTasks]
    updated[index] = { ...updated[index], taskName: value }
    onChangePlanned(updated)
  }

  const updatePlannedHours = (index: number, value: string) => {
    const updated = [...plannedTasks]
    updated[index] = { ...updated[index], actualHours: value }
    onChangePlanned(updated)
  }

  const removePlannedTask = (index: number) => {
    onChangePlanned(plannedTasks.filter((_, i) => i !== index))
  }

  // ===== 予定外タスク操作 =====

  const updateExtraTaskName = (index: number, value: string) => {
    const updated = [...extraTasks]
    updated[index] = { ...updated[index], taskName: value }
    onChangeExtra(updated)
  }

  const updateExtraTaskHours = (index: number, value: string) => {
    const updated = [...extraTasks]
    updated[index] = { ...updated[index], hours: value }
    onChangeExtra(updated)
  }

  const removeExtraTask = (index: number) => {
    onChangeExtra(extraTasks.filter((_, i) => i !== index))
  }

  const addExtraTask = () => {
    onChangeExtra([...extraTasks, createEmptyTask()])
  }

  return (
    <div>
      <Label className="text-base">{label}</Label>
      <div className="space-y-3 mt-3">
        {/* 予定タスク一覧（出勤登録と同じ行スタイル） */}
        {plannedTasks.map((task, index) => (
          <div key={task.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                value={task.taskName}
                onChange={(e) => updatePlannedTaskName(index, e.target.value)}
              />
            </div>
            <div className="w-28">
              <Input
                type="time"
                value={task.actualHours}
                onChange={(e) => updatePlannedHours(index, e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removePlannedTask(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* 予定外タスクセクション */}
        <div className={`${plannedTasks.length > 0 ? "border-t" : ""} pt-3 space-y-3`}>
          {extraTasks.map((task, index) => (
            <div key={task.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="タスク名"
                  value={task.taskName}
                  onChange={(e) => updateExtraTaskName(index, e.target.value)}
                />
              </div>
              <div className="w-28">
                <Input
                  type="time"
                  value={task.hours}
                  onChange={(e) => updateExtraTaskHours(index, e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeExtraTask(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addExtraTask} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            タスクを追加
          </Button>
        </div>
      </div>
    </div>
  )
}
