// lib/task-form.ts
// タスクフォーム用の共通ユーティリティ

import type { Task } from "@/types/Attendance"

/**
 * UI用のフォーム状態
 */
export interface TaskFormItem {
  id: string
  taskName: string
  hours: string
}

/**
 * ユニークIDを生成
 */
export function generateTaskId(): string {
  return crypto.randomUUID()
}

/**
 * 空のタスクアイテムを作成（工数はデフォルト1時間）
 */
export function createEmptyTask(): TaskFormItem {
  return { id: generateTaskId(), taskName: "", hours: "01:00" }
}

/**
 * HH:mm形式の文字列を時間（小数）に変換
 * 例: "01:30" → 1.5, "02:00" → 2.0, "00:30" → 0.5
 */
function parseTimeToHours(timeStr: string): number | null {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours + minutes / 60
}

/**
 * フォーム状態をTask型に変換
 */
export function toTasks(items: TaskFormItem[]): Task[] {
  return items
    .filter((item) => item.taskName.trim() !== "")
    .map((item) => ({
      taskName: item.taskName.trim(),
      hours: parseTimeToHours(item.hours),
    }))
}

/**
 * 初期タスクリストを作成
 */
export function createInitialTasks(): TaskFormItem[] {
  return [createEmptyTask()]
}
