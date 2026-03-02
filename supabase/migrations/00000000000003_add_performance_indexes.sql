-- ============================
-- パフォーマンス改善: 不足インデックスの追加
-- ============================

-- work_sessions: attendance_id + clock_out の複合インデックス
-- findActiveSession, findActiveSessionWithSlackTs, getSessionIdsByAttendanceId で使用
CREATE INDEX IF NOT EXISTS idx_work_sessions_attendance_id_clock_out
  ON public.work_sessions (attendance_id, clock_out);

-- breaks: session_id のインデックス
-- findActiveBreak, deleteBySessionIds で使用
CREATE INDEX IF NOT EXISTS idx_breaks_session_id
  ON public.breaks (session_id);

-- daily_reports: user_id + date の複合インデックス
-- findReportsByDateRange, findUnsubmittedReport で使用
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id_date
  ON public.daily_reports (user_id, date);
