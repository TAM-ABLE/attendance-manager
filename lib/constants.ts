// shared/lib/constants.ts
// フロントエンド・バックエンド共通の定数

// タスクタイプ
export const TASK_TYPE_PLANNED = "planned" as const
export const TASK_TYPE_ACTUAL = "actual" as const
export type TaskType = typeof TASK_TYPE_PLANNED | typeof TASK_TYPE_ACTUAL

// 社員番号
export const EMPLOYEE_NUMBER_PREFIX = "A-"
export const EMPLOYEE_NUMBER_PAD = 4
export const EMPLOYEE_NUMBER_DEFAULT = "A-0001"

// バリデーション制限
export const MAX_TASK_HOURS = 24
export const MIN_TASK_HOURS = 0
export const MAX_SESSIONS_PER_DAY = 3
export const MAX_TASK_NAME_LENGTH = 200
export const MAX_TEXT_FIELD_LENGTH = 1000

// 日付フォーマット正規表現
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
export const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/

// UUID形式の正規表現（RFC 4122）
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * UUID形式かどうかをチェック
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}
