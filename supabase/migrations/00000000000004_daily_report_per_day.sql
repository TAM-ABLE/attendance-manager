-- ============================
-- 1日1日報: daily_reports を1日1件に制約 + タスクにセッション紐付け + Slack TS 移動
-- ============================

-- 1. daily_reports に (user_id, date) UNIQUE 制約を追加
-- まず既存の重複データを統合
-- 同一 (user_id, date) で複数行ある場合、最新の1件を残して削除
DELETE FROM public.daily_reports
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, date) id
    FROM public.daily_reports
    ORDER BY user_id, date, created_at DESC
);

ALTER TABLE public.daily_reports
    ADD CONSTRAINT daily_reports_user_date_unique UNIQUE (user_id, date);

-- 2. daily_report_tasks に work_session_id カラムを追加
ALTER TABLE public.daily_report_tasks
    ADD COLUMN work_session_id uuid REFERENCES public.work_sessions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_daily_report_tasks_session_id
    ON public.daily_report_tasks (work_session_id);

COMMENT ON COLUMN public.daily_report_tasks.work_session_id IS 'タスクを入力したセッションのID（退勤ダイアログで当該セッションのタスクのみ表示するため）';

-- 3. attendance_records に Slack メッセージ TS カラムを追加
ALTER TABLE public.attendance_records
    ADD COLUMN slack_clock_in_ts text,
    ADD COLUMN slack_clock_out_ts text;

COMMENT ON COLUMN public.attendance_records.slack_clock_in_ts IS '出勤Slackメッセージのタイムスタンプ（chat.update用）';
COMMENT ON COLUMN public.attendance_records.slack_clock_out_ts IS '退勤Slackメッセージのタイムスタンプ（chat.update用）';

-- 4. 既存データの slack_clock_in_ts を work_sessions → attendance_records にコピー
-- 各 attendance_record の最初のセッションの slack_clock_in_ts を移行
UPDATE public.attendance_records ar
SET slack_clock_in_ts = ws.slack_clock_in_ts
FROM (
    SELECT DISTINCT ON (attendance_id) attendance_id, slack_clock_in_ts
    FROM public.work_sessions
    WHERE slack_clock_in_ts IS NOT NULL
    ORDER BY attendance_id, clock_in ASC
) ws
WHERE ar.id = ws.attendance_id;

-- 5. work_sessions から slack_clock_in_ts カラムを削除
ALTER TABLE public.work_sessions
    DROP COLUMN slack_clock_in_ts;
