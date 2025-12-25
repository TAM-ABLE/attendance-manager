// frontend/lib/task-form.ts
// タスクフォーム用の共通ユーティリティ

import type { Task } from "../../shared/types/Attendance";

/**
 * UI用のフォーム状態
 */
export interface TaskFormItem {
    id: string;
    taskName: string;
    hours: string;
}

/**
 * ユニークIDを生成
 */
export function generateTaskId(): string {
    return crypto.randomUUID();
}

/**
 * 空のタスクアイテムを作成
 */
export function createEmptyTask(): TaskFormItem {
    return { id: generateTaskId(), taskName: "", hours: "" };
}

/**
 * フォーム状態をTask型に変換
 */
export function toTasks(items: TaskFormItem[]): Task[] {
    return items
        .filter((item) => item.taskName.trim() !== "")
        .map((item) => ({
            taskName: item.taskName.trim(),
            hours: item.hours ? parseFloat(item.hours) : null,
        }));
}

/**
 * 初期タスクリストを作成
 */
export function createInitialTasks(): TaskFormItem[] {
    return [createEmptyTask()];
}
