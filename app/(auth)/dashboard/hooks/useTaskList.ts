"use client"

import { useState } from "react"
import { createEmptyTask, generateTaskId, type TaskFormItem } from "@/lib/task-form"

export function useTaskList() {
  const [tasks, setTasks] = useState<TaskFormItem[]>([])
  const [hasValidated, setHasValidated] = useState(false)

  const hasTaskError = tasks.length === 0 || tasks.some((t) => t.taskName.trim() === "")

  const updateTaskName = (index: number, value: string) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], taskName: value }
    setTasks(updated)
  }

  const updateTaskHours = (index: number, value: string) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], hours: value }
    setTasks(updated)
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const addTask = () => {
    setTasks([...tasks, createEmptyTask()])
  }

  const toggleChip = (taskName: string) => {
    const existingIndex = tasks.findIndex((t) => t.taskName === taskName)
    if (existingIndex >= 0) {
      setTasks(tasks.filter((_, i) => i !== existingIndex))
    } else {
      setTasks([...tasks, { id: generateTaskId(), taskName, hours: "01:00" }])
    }
  }

  const selectedTaskNames = new Set(tasks.map((t) => t.taskName))

  /** バリデーションを実行し、エラーがなければ true を返す */
  const validate = (): boolean => {
    setHasValidated(true)
    return !hasTaskError
  }

  const reset = () => {
    setTasks([])
    setHasValidated(false)
  }

  return {
    tasks,
    setTasks,
    hasValidated,
    hasTaskError,
    updateTaskName,
    updateTaskHours,
    removeTask,
    addTask,
    toggleChip,
    selectedTaskNames,
    validate,
    reset,
  }
}
