-- ============================
-- Supabase Auth 移行マイグレーション
-- ============================

-- 1. users テーブルを profiles に改名
ALTER TABLE public.users RENAME TO profiles;

-- 2. hashed_password カラムを削除（Supabase Auth が管理）
ALTER TABLE public.profiles DROP COLUMN hashed_password;

-- 3. 新規ユーザー作成時に自動的にプロファイルを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, employee_number, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        LEFT(NEW.id::text, 8),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        now(),
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- トリガーを作成
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- RLS (Row Level Security) 有効化
-- ============================

-- profiles テーブル
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- attendance_records テーブル
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- work_sessions テーブル
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- breaks テーブル
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- daily_reports テーブル
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- daily_report_tasks テーブル
ALTER TABLE public.daily_report_tasks ENABLE ROW LEVEL SECURITY;

-- ============================
-- RLS ポリシー: profiles
-- ============================

-- ユーザーは自分のプロファイルのみ参照可能
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のプロファイルのみ更新可能
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 管理者は全プロファイルを参照可能
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================
-- RLS ポリシー: attendance_records
-- ============================

-- ユーザーは自分の勤怠記録のみ参照可能
CREATE POLICY "Users can view own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の勤怠記録を作成可能
CREATE POLICY "Users can insert own attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の勤怠記録を更新可能
CREATE POLICY "Users can update own attendance" ON public.attendance_records
    FOR UPDATE USING (auth.uid() = user_id);

-- 管理者は全勤怠記録を参照可能
CREATE POLICY "Admins can view all attendance" ON public.attendance_records
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 管理者は全勤怠記録を更新可能
CREATE POLICY "Admins can update all attendance" ON public.attendance_records
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 管理者は勤怠記録を作成可能
CREATE POLICY "Admins can insert attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================
-- RLS ポリシー: work_sessions
-- ============================

-- ユーザーは自分のセッションのみ参照可能
CREATE POLICY "Users can view own sessions" ON public.work_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id
            AND ar.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションを作成可能
CREATE POLICY "Users can insert own sessions" ON public.work_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id
            AND ar.user_id = auth.uid()
        )
    );

-- ユーザーは自分のセッションを更新可能
CREATE POLICY "Users can update own sessions" ON public.work_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.attendance_records ar
            WHERE ar.id = work_sessions.attendance_id
            AND ar.user_id = auth.uid()
        )
    );

-- 管理者は全セッションを操作可能
CREATE POLICY "Admins can manage all sessions" ON public.work_sessions
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================
-- RLS ポリシー: breaks
-- ============================

-- ユーザーは自分の休憩のみ参照可能
CREATE POLICY "Users can view own breaks" ON public.breaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id
            AND ar.user_id = auth.uid()
        )
    );

-- ユーザーは自分の休憩を作成可能
CREATE POLICY "Users can insert own breaks" ON public.breaks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id
            AND ar.user_id = auth.uid()
        )
    );

-- ユーザーは自分の休憩を更新可能
CREATE POLICY "Users can update own breaks" ON public.breaks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.work_sessions ws
            JOIN public.attendance_records ar ON ar.id = ws.attendance_id
            WHERE ws.id = breaks.session_id
            AND ar.user_id = auth.uid()
        )
    );

-- 管理者は全休憩を操作可能
CREATE POLICY "Admins can manage all breaks" ON public.breaks
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================
-- RLS ポリシー: daily_reports
-- ============================

-- ユーザーは自分の日報のみ参照可能
CREATE POLICY "Users can view own reports" ON public.daily_reports
    FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の日報を作成可能
CREATE POLICY "Users can insert own reports" ON public.daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の日報を更新可能
CREATE POLICY "Users can update own reports" ON public.daily_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- 管理者は全日報を参照可能
CREATE POLICY "Admins can view all reports" ON public.daily_reports
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================
-- RLS ポリシー: daily_report_tasks
-- ============================

-- ユーザーは自分のタスクのみ参照可能
CREATE POLICY "Users can view own tasks" ON public.daily_report_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id
            AND dr.user_id = auth.uid()
        )
    );

-- ユーザーは自分のタスクを作成可能
CREATE POLICY "Users can insert own tasks" ON public.daily_report_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id
            AND dr.user_id = auth.uid()
        )
    );

-- ユーザーは自分のタスクを更新可能
CREATE POLICY "Users can update own tasks" ON public.daily_report_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.daily_reports dr
            WHERE dr.id = daily_report_tasks.daily_report_id
            AND dr.user_id = auth.uid()
        )
    );

-- 管理者は全タスクを参照可能
CREATE POLICY "Admins can view all tasks" ON public.daily_report_tasks
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 管理者は全タスクを操作可能
CREATE POLICY "Admins can manage all tasks" ON public.daily_report_tasks
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
