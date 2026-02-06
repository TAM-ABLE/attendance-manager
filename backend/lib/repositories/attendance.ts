// backend/lib/repositories/attendance.ts
// 勤怠データアクセス層

import type { SupabaseClient } from "@supabase/supabase-js"
import type { DbAttendanceRecord } from "../formatters"

const ATTENDANCE_SELECT_QUERY = `
    id,
    date,
    work_sessions (
        id,
        clock_in,
        clock_out,
        breaks (
            id,
            break_start,
            break_end
        )
    )
`

/**
 * 勤怠レコードRepository
 */
export class AttendanceRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 特定日の勤怠レコードIDを取得（存在しない場合はnull）
   */
  async findRecordIdByUserAndDate(userId: string, date: string): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("attendance_records")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 勤怠レコードを作成
   */
  async createRecord(userId: string, date: string): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("attendance_records")
      .insert({ user_id: userId, date })
      .select("id")
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 勤怠レコードを取得または作成
   */
  async findOrCreateRecord(userId: string, date: string): Promise<{ id: string }> {
    const existing = await this.findRecordIdByUserAndDate(userId, date)
    if (existing) {
      return existing
    }
    return this.createRecord(userId, date)
  }

  /**
   * 特定日の勤怠レコードを取得（セッション・休憩含む）
   */
  async findRecordWithSessions(userId: string, date: string): Promise<DbAttendanceRecord | null> {
    const { data, error } = await this.supabase
      .from("attendance_records")
      .select(ATTENDANCE_SELECT_QUERY)
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle<DbAttendanceRecord>()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 期間内の勤怠レコード一覧を取得
   */
  async findRecordsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DbAttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from("attendance_records")
      .select(ATTENDANCE_SELECT_QUERY)
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .returns<DbAttendanceRecord[]>()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }
}

/**
 * ワークセッションRepository
 */
export class WorkSessionRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * アクティブなセッション（clock_outがnull）を取得
   */
  async findActiveSession(attendanceId: string): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("work_sessions")
      .select("id")
      .eq("attendance_id", attendanceId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * セッションを作成（IDを返す）
   */
  async createSession(attendanceId: string, clockIn: string): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("work_sessions")
      .insert({
        attendance_id: attendanceId,
        clock_in: clockIn,
      })
      .select("id")
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * セッションのclock_outを更新
   */
  async updateClockOut(sessionId: string, clockOut: string): Promise<void> {
    const { error } = await this.supabase
      .from("work_sessions")
      .update({ clock_out: clockOut })
      .eq("id", sessionId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * アクティブなセッションをSlack TS付きで取得
   */
  async findActiveSessionWithSlackTs(
    attendanceId: string,
  ): Promise<{ id: string; slack_clock_in_ts: string | null } | null> {
    const { data, error } = await this.supabase
      .from("work_sessions")
      .select("id, slack_clock_in_ts")
      .eq("attendance_id", attendanceId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * Slack TSを更新
   */
  async updateSlackTs(sessionId: string, slackTs: string): Promise<void> {
    const { error } = await this.supabase
      .from("work_sessions")
      .update({ slack_clock_in_ts: slackTs })
      .eq("id", sessionId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * attendance_idに紐づくセッションIDを取得
   */
  async getSessionIdsByAttendanceId(attendanceId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("work_sessions")
      .select("id")
      .eq("attendance_id", attendanceId)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return (data ?? []).map((s) => s.id)
  }

  /**
   * セッションを一括削除
   */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    const { error } = await this.supabase.from("work_sessions").delete().in("id", ids)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * セッションを一括挿入
   */
  async insertMultiple(
    attendanceId: string,
    sessions: { clockIn: string; clockOut: string | null }[],
  ): Promise<{ id: string }[]> {
    if (sessions.length === 0) return []

    const inserts = sessions.map((s) => ({
      attendance_id: attendanceId,
      clock_in: s.clockIn,
      clock_out: s.clockOut,
    }))

    const { data, error } = await this.supabase.from("work_sessions").insert(inserts).select("id")

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data ?? []
  }
}

/**
 * 休憩Repository
 */
export class BreakRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * アクティブな休憩（break_endがnull）を取得
   */
  async findActiveBreak(sessionId: string): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("breaks")
      .select("id")
      .eq("session_id", sessionId)
      .is("break_end", null)
      .order("break_start", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 休憩を開始
   */
  async startBreak(sessionId: string, breakStart: string): Promise<void> {
    const { error } = await this.supabase.from("breaks").insert({
      session_id: sessionId,
      break_start: breakStart,
    })

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * 休憩を終了
   */
  async endBreak(breakId: string, breakEnd: string): Promise<void> {
    const { error } = await this.supabase
      .from("breaks")
      .update({ break_end: breakEnd })
      .eq("id", breakId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * セッションIDに紐づく休憩を一括削除
   */
  async deleteBySessionIds(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return

    const { error } = await this.supabase.from("breaks").delete().in("session_id", sessionIds)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * 休憩を一括挿入
   */
  async insertMultiple(
    breaks: { sessionId: string; breakStart: string; breakEnd: string | null }[],
  ): Promise<void> {
    if (breaks.length === 0) return

    const inserts = breaks.map((b) => ({
      session_id: b.sessionId,
      break_start: b.breakStart,
      break_end: b.breakEnd,
    }))

    const { error } = await this.supabase.from("breaks").insert(inserts)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }
}

/**
 * Database操作エラー
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseError"
  }
}
