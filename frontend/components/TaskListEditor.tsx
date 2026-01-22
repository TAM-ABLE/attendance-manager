// frontend/components/TaskListEditor.tsx
// タスクリスト編集用の共通コンポーネント

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type TaskFormItem, createEmptyTask } from "@/lib/task-form"
import { Plus, X } from "lucide-react"

interface TaskListEditorProps {
  /** タスクリスト */
  tasks: TaskFormItem[]
  /** タスクリスト更新時のコールバック */
  onChange: (tasks: TaskFormItem[]) => void
  /** ラベルテキスト */
  label: string
  /** タスク名のプレースホルダー */
  taskNamePlaceholder?: string
}

/**
 * タスクリスト編集コンポーネント
 * ClockInDialog と ClockOutDialog で共通利用
 */
export function TaskListEditor({
  tasks,
  onChange,
  label,
  taskNamePlaceholder = "タスク名",
}: TaskListEditorProps) {
  const updateTaskName = (index: number, value: string) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], taskName: value }
    onChange(newTasks)
  }

  const updateTaskHours = (index: number, value: string) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], hours: value }
    onChange(newTasks)
  }

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index))
  }

  const addTask = () => {
    onChange([...tasks, createEmptyTask()])
  }

  return (
    <div>
      <Label className="text-base">{label}</Label>
      <div className="space-y-3 mt-3">
        {tasks.map((task, index) => (
          <div key={task.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                placeholder={taskNamePlaceholder}
                value={task.taskName}
                onChange={(e) => updateTaskName(index, e.target.value)}
              />
            </div>
            <div className="w-28">
              <Input
                type="time"
                value={task.hours}
                onChange={(e) => updateTaskHours(index, e.target.value)}
              />
            </div>
            {tasks.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeTask(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addTask} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          タスクを追加
        </Button>
      </div>
    </div>
  )
}
