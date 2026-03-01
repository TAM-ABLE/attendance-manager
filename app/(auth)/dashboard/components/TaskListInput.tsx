"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { useTaskList } from "../hooks/useTaskList"

type TaskListInputProps = {
  taskList: ReturnType<typeof useTaskList>
}

export function TaskListInput({ taskList }: TaskListInputProps) {
  return (
    <div className="space-y-3">
      {taskList.tasks.map((task, index) => (
        <div key={task.id} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              placeholder="タスク名"
              value={task.taskName}
              onChange={(e) => taskList.updateTaskName(index, e.target.value)}
              className={
                taskList.hasValidated && task.taskName.trim() === "" ? "border-red-500" : ""
              }
            />
          </div>
          <div className="w-28">
            <Input
              type="time"
              value={task.hours}
              onChange={(e) => taskList.updateTaskHours(index, e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => taskList.removeTask(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={taskList.addTask} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        タスクを追加
      </Button>
    </div>
  )
}
