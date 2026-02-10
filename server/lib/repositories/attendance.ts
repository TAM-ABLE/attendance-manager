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

export class AttendanceRepository {
  constructor(private supabase: SupabaseClient) {}

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

  async findOrCreateRecord(userId: string, date: string): Promise<{ id: string }> {
    const existing = await this.findRecordIdByUserAndDate(userId, date)
    if (existing) {
      return existing
    }
    return this.createRecord(userId, date)
  }

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

export class WorkSessionRepository {
  constructor(private supabase: SupabaseClient) {}

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

  async updateClockOut(sessionId: string, clockOut: string): Promise<void> {
    const { error } = await this.supabase
      .from("work_sessions")
      .update({ clock_out: clockOut })
      .eq("id", sessionId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

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

  async updateSlackTs(sessionId: string, slackTs: string): Promise<void> {
    const { error } = await this.supabase
      .from("work_sessions")
      .update({ slack_clock_in_ts: slackTs })
      .eq("id", sessionId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

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

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    const { error } = await this.supabase.from("work_sessions").delete().in("id", ids)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

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

export class BreakRepository {
  constructor(private supabase: SupabaseClient) {}

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

  async startBreak(sessionId: string, breakStart: string): Promise<void> {
    const { error } = await this.supabase.from("breaks").insert({
      session_id: sessionId,
      break_start: breakStart,
    })

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  async endBreak(breakId: string, breakEnd: string): Promise<void> {
    const { error } = await this.supabase
      .from("breaks")
      .update({ break_end: breakEnd })
      .eq("id", breakId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  async deleteBySessionIds(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return

    const { error } = await this.supabase.from("breaks").delete().in("session_id", sessionIds)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

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

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseError"
  }
}
