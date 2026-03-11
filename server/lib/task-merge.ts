import type { Task } from "@/types/Attendance"
import type { DailyReportTask } from "@/types/DailyReport"

/** 同名タスクを統合し、時間を合算する */
export function mergeTasksByName(tasks: { taskName: string; hours: number | null }[]): Task[] {
  const merged = new Map<string, number | null>()
  for (const task of tasks) {
    const existing = merged.get(task.taskName)
    if (existing !== undefined) {
      if (existing != null && task.hours != null) {
        merged.set(task.taskName, existing + task.hours)
      }
    } else {
      merged.set(task.taskName, task.hours)
    }
  }
  return Array.from(merged.entries()).map(([taskName, hours]) => ({ taskName, hours }))
}

export function mergeTasks(
  tasks: { id: string; taskName: string; hours: number | null; sortOrder: number }[],
  taskType: "planned" | "actual",
): DailyReportTask[] {
  const merged = new Map<string, { id: string; hours: number | null; sortOrder: number }>()

  for (const task of tasks) {
    const existing = merged.get(task.taskName)
    if (existing) {
      if (existing.hours != null && task.hours != null) {
        existing.hours += task.hours
      }
    } else {
      merged.set(task.taskName, {
        id: task.id,
        hours: task.hours,
        sortOrder: task.sortOrder,
      })
    }
  }

  let index = 0
  return Array.from(merged.entries()).map(([taskName, data]) => ({
    id: data.id,
    taskType,
    taskName,
    hours: data.hours,
    sortOrder: index++,
  }))
}
