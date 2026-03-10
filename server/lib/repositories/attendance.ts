import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm"
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
    const [result] = await this.db
      .insert(attendanceRecords)
      .values({ userId, date })
      .onConflictDoUpdate({
        target: [attendanceRecords.userId, attendanceRecords.date],
        set: { userId: attendanceRecords.userId },
      })
      .returning({ id: attendanceRecords.id })
    return result
  }

  async getSlackTs(
    recordId: string,
  ): Promise<{ slackClockInTs: string | null; slackClockOutTs: string | null }> {
    const result = await this.db
      .select({
        slackClockInTs: attendanceRecords.slackClockInTs,
        slackClockOutTs: attendanceRecords.slackClockOutTs,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.id, recordId))
      .limit(1)
    return result[0] ?? { slackClockInTs: null, slackClockOutTs: null }
  }

  async updateSlackClockInTs(recordId: string, slackTs: string): Promise<void> {
    await this.db
      .update(attendanceRecords)
      .set({ slackClockInTs: slackTs })
      .where(eq(attendanceRecords.id, recordId))
  }

  async updateSlackClockOutTs(recordId: string, slackTs: string): Promise<void> {
    await this.db
      .update(attendanceRecords)
      .set({ slackClockOutTs: slackTs })
      .where(eq(attendanceRecords.id, recordId))
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

  async calculateNetWorkMsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const result = await this.db
      .select({
        netWorkMs: sql<number>`COALESCE(SUM(
          GREATEST(0,
            EXTRACT(EPOCH FROM (${workSessions.clockOut} - ${workSessions.clockIn})) * 1000
            - COALESCE((
              SELECT SUM(EXTRACT(EPOCH FROM (${breaks.breakEnd} - ${breaks.breakStart})) * 1000)
              FROM ${breaks}
              WHERE ${breaks.sessionId} = ${workSessions.id}
                AND ${breaks.breakEnd} IS NOT NULL
            ), 0)
          )
        ), 0)::bigint`,
      })
      .from(attendanceRecords)
      .innerJoin(workSessions, eq(workSessions.attendanceId, attendanceRecords.id))
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, startDate),
          lte(attendanceRecords.date, endDate),
          sql`${workSessions.clockOut} IS NOT NULL`,
        ),
      )
    return Number(result[0]?.netWorkMs ?? 0)
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
