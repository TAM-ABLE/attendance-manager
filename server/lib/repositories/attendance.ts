import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm"
import type { Db } from "../../db"
import { attendanceRecords, breaks, workSessions } from "../../db/schema"
import type { DbAttendanceRecord } from "../formatters"

export class AttendanceRepository {
  constructor(private db: Db) {}

  async findRecordIdByUserAndDate(userId: string, date: string): Promise<{ id: string } | null> {
    const result = await this.db
      .select({ id: attendanceRecords.id })
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)))
      .limit(1)
    return result[0] ?? null
  }

  async createRecord(userId: string, date: string): Promise<{ id: string }> {
    const [result] = await this.db
      .insert(attendanceRecords)
      .values({ userId, date })
      .returning({ id: attendanceRecords.id })
    return result
  }

  async findOrCreateRecord(userId: string, date: string): Promise<{ id: string }> {
    const existing = await this.findRecordIdByUserAndDate(userId, date)
    if (existing) return existing
    return this.createRecord(userId, date)
  }

  async findRecordWithSessions(userId: string, date: string): Promise<DbAttendanceRecord | null> {
    const result = await this.db.query.attendanceRecords.findFirst({
      where: and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date)),
      columns: { id: true, date: true },
      with: {
        workSessions: {
          columns: { id: true, clockIn: true, clockOut: true },
          with: {
            breaks: {
              columns: { id: true, breakStart: true, breakEnd: true },
            },
          },
        },
      },
    })
    return (result as DbAttendanceRecord | undefined) ?? null
  }

  async findRecordsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<DbAttendanceRecord[]> {
    const result = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate),
      ),
      orderBy: [asc(attendanceRecords.date)],
      columns: { id: true, date: true },
      with: {
        workSessions: {
          columns: { id: true, clockIn: true, clockOut: true },
          with: {
            breaks: {
              columns: { id: true, breakStart: true, breakEnd: true },
            },
          },
        },
      },
    })
    return result as DbAttendanceRecord[]
  }
}

export class WorkSessionRepository {
  constructor(private db: Db) {}

  async findActiveSession(attendanceId: string): Promise<{ id: string } | null> {
    const result = await this.db
      .select({ id: workSessions.id })
      .from(workSessions)
      .where(and(eq(workSessions.attendanceId, attendanceId), isNull(workSessions.clockOut)))
      .orderBy(desc(workSessions.clockIn))
      .limit(1)
    return result[0] ?? null
  }

  async createSession(attendanceId: string, clockIn: string): Promise<{ id: string }> {
    const [result] = await this.db
      .insert(workSessions)
      .values({ attendanceId, clockIn })
      .returning({ id: workSessions.id })
    return result
  }

  async updateClockOut(sessionId: string, clockOut: string): Promise<void> {
    await this.db.update(workSessions).set({ clockOut }).where(eq(workSessions.id, sessionId))
  }

  async findActiveSessionWithSlackTs(
    attendanceId: string,
  ): Promise<{ id: string; slack_clock_in_ts: string | null } | null> {
    const result = await this.db
      .select({
        id: workSessions.id,
        slack_clock_in_ts: workSessions.slackClockInTs,
      })
      .from(workSessions)
      .where(and(eq(workSessions.attendanceId, attendanceId), isNull(workSessions.clockOut)))
      .orderBy(desc(workSessions.clockIn))
      .limit(1)
    return result[0] ?? null
  }

  async updateSlackTs(sessionId: string, slackTs: string): Promise<void> {
    await this.db
      .update(workSessions)
      .set({ slackClockInTs: slackTs })
      .where(eq(workSessions.id, sessionId))
  }

  async getSessionIdsByAttendanceId(attendanceId: string): Promise<string[]> {
    const result = await this.db
      .select({ id: workSessions.id })
      .from(workSessions)
      .where(eq(workSessions.attendanceId, attendanceId))
    return result.map((s) => s.id)
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.db.delete(workSessions).where(inArray(workSessions.id, ids))
  }

  async insertMultiple(
    attendanceId: string,
    sessions: { clockIn: string; clockOut: string | null }[],
  ): Promise<{ id: string }[]> {
    if (sessions.length === 0) return []
    return this.db
      .insert(workSessions)
      .values(
        sessions.map((s) => ({
          attendanceId,
          clockIn: s.clockIn,
          clockOut: s.clockOut,
        })),
      )
      .returning({ id: workSessions.id })
  }
}

export class BreakRepository {
  constructor(private db: Db) {}

  async findActiveBreak(sessionId: string): Promise<{ id: string } | null> {
    const result = await this.db
      .select({ id: breaks.id })
      .from(breaks)
      .where(and(eq(breaks.sessionId, sessionId), isNull(breaks.breakEnd)))
      .orderBy(desc(breaks.breakStart))
      .limit(1)
    return result[0] ?? null
  }

  async startBreak(sessionId: string, breakStart: string): Promise<void> {
    await this.db.insert(breaks).values({ sessionId, breakStart })
  }

  async endBreak(breakId: string, breakEnd: string): Promise<void> {
    await this.db.update(breaks).set({ breakEnd }).where(eq(breaks.id, breakId))
  }

  async deleteBySessionIds(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return
    await this.db.delete(breaks).where(inArray(breaks.sessionId, sessionIds))
  }

  async insertMultiple(
    breaksData: { sessionId: string; breakStart: string; breakEnd: string | null }[],
  ): Promise<void> {
    if (breaksData.length === 0) return
    await this.db.insert(breaks).values(breaksData)
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseError"
  }
}
