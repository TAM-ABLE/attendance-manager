-- ============================
-- work_sessions に slack_clock_in_ts カラムを追加
-- 出勤時のSlackメッセージtsを保存し、退勤時にスレッド返信として使用
-- ============================
ALTER TABLE public.work_sessions
ADD COLUMN slack_clock_in_ts text;

COMMENT ON COLUMN public.work_sessions.slack_clock_in_ts IS '出勤時のSlackメッセージタイムスタンプ（スレッド返信用）';
