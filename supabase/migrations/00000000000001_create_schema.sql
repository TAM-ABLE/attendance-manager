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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_tasks ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- attendance_records
CREATE POLICY "Users can view own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance_records
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attendance" ON public.attendance_records
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
CREATE POLICY "Admins can update all attendance" ON public.attendance_records
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
CREATE POLICY "Admins can insert attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- work_sessions
CREATE POLICY "Users can view own sessions" ON public.work_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own sessions" ON public.work_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own sessions" ON public.work_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Admins can manage all sessions" ON public.work_sessions
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- breaks
CREATE POLICY "Users can view own breaks" ON public.breaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own breaks" ON public.breaks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own breaks" ON public.breaks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id AND ar.user_id = auth.uid()
        )
    );
CREATE POLICY "Admins can manage all breaks" ON public.breaks
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- daily_reports
CREATE POLICY "Users can view own reports" ON public.daily_reports
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.daily_reports
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON public.daily_reports
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- daily_report_tasks
CREATE POLICY "Users can view own tasks" ON public.daily_report_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id AND dr.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own tasks" ON public.daily_report_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id AND dr.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own tasks" ON public.daily_report_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id AND dr.user_id = auth.uid()
        )
    );
CREATE POLICY "Admins can view all tasks" ON public.daily_report_tasks
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
CREATE POLICY "Admins can manage all tasks" ON public.daily_report_tasks
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
