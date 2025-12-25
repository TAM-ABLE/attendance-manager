// shared/lib/constants.ts
// フロントエンド・バックエンド共通の定数

// キャッシュ時間（秒）
export const CACHE_CURRENT_MONTH_SEC = 60;
export const CACHE_PAST_MONTH_SEC = 300;

// バリデーション制限
export const MAX_TASK_HOURS = 24;
export const MIN_TASK_HOURS = 0;
export const MAX_SESSIONS_PER_DAY = 3;
export const MAX_TASK_NAME_LENGTH = 200;
export const MAX_TEXT_FIELD_LENGTH = 1000;

// 日付フォーマット正規表現
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/;
export const TIME_REGEX = /^\d{2}:\d{2}$/;
