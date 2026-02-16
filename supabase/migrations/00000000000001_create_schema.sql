-- ============================
-- 初期スキーマ（統合マイグレーション）
-- ============================

-- ============================
-- profiles（Supabase Auth 連携）
-- ============================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    employee_number text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================
-- attendance_records
-- ============================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT attendance_records_user_date_unique UNIQUE (user_id, date)
);

-- ============================
-- work_sessions
-- ============================
CREATE TABLE IF NOT EXISTS public.work_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id uuid NOT NULL REFERENCES public.attendance_records (id) ON DELETE CASCADE,
    clock_in timestamptz NOT NULL,
    clock_out timestamptz,
    slack_clock_in_ts text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.work_sessions.slack_clock_in_ts IS '出勤時のSlackメッセージタイムスタンプ（スレッド返信用）';

-- ============================
-- breaks
-- ============================
CREATE TABLE IF NOT EXISTS public.breaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.work_sessions (id) ON DELETE CASCADE,
    break_start timestamptz NOT NULL,
    break_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================
-- daily_reports
-- ============================
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    date date NOT NULL,
    summary text,
    issues text,
    notes text,
    submitted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON public.daily_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports (date);

-- ============================
-- daily_report_tasks
-- ============================
CREATE TABLE IF NOT EXISTS public.daily_report_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id uuid NOT NULL REFERENCES public.daily_reports (id) ON DELETE CASCADE,
    task_type text NOT NULL,
    task_name text NOT NULL,
    hours numeric(4,2),
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_report_tasks_report_id ON public.daily_report_tasks (daily_report_id);

-- ============================
-- Supabase Auth トリガー
-- auth.users 作成時に profiles を自動作成
-- ============================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, employee_number, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'employee_number', LEFT(NEW.id::text, 8)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        now(),
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- RLS (Row Level Security)
-- ============================
-- RLS は無効化。認可はアプリケーションレベル（JWT + Drizzle ORM）で実装。
-- 詳細: 00000000000002_disable_rls.sql
