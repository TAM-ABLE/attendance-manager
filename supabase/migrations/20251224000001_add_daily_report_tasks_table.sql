-- ============================
-- daily_report_tasks (日報のタスク)
-- ============================
CREATE TABLE IF NOT EXISTS public.daily_report_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id uuid NOT NULL REFERENCES public.daily_reports (id) ON DELETE CASCADE,
    task_type text NOT NULL,                   -- 'planned' | 'actual'
    task_name text NOT NULL,                   -- タスク名
    hours numeric(4,2),                        -- 作業時間（時間単位）
    sort_order int NOT NULL DEFAULT 0,         -- 表示順
    created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_daily_report_tasks_report_id ON public.daily_report_tasks (daily_report_id);
