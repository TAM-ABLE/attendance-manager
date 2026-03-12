-- ============================
-- パフォーマンス改善: 不足インデックスの追加
-- ============================

-- work_sessions: attendance_id + clock_out の複合インデックス
-- findActiveSession, getSessionIdsByAttendanceId で使用
CREATE INDEX IF NOT EXISTS idx_work_sessions_attendance_id_clock_out
  ON public.work_sessions (attendance_id, clock_out);

-- breaks: session_id のインデックス
-- findActiveBreak, deleteBySessionIds で使用
CREATE INDEX IF NOT EXISTS idx_breaks_session_id
  ON public.breaks (session_id);

-- daily_report_tasks: work_session_id のインデックス
-- 退勤ダイアログで当該セッションのタスクを取得する際に使用
CREATE INDEX IF NOT EXISTS idx_daily_report_tasks_session_id
  ON public.daily_report_tasks (work_session_id);

-- NOTE: daily_reports (user_id, date) は UNIQUE 制約で暗黙的にインデックスが作成済み
