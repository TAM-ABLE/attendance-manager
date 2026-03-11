import { and, asc, eq, gte, isNotNull, lte, ne } from "drizzle-orm"
import type { Db } from "../../db"
import { dailyReports, dailyReportTasks } from "../../db/schema"
import { DatabaseError } from "./errors"

export class DailyReportRepository {
  constructor(private db: Db) {}

  async findOrCreateReport(userId: string, date: string): Promise<{ id: string }> {
    const existing = await this.db
      .select({ id: dailyReports.id })
      .from(dailyReports)
      .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)))
      .limit(1)

    if (existing[0]) return existing[0]

    const [result] = await this.db
      .insert(dailyReports)
      .values({ userId, date })
      .returning({ id: dailyReports.id })
    return result
  }

  async insertTasks(
    reportId: string,
    tasks: {
      taskType: string
      taskName: string
      hours: number | null
      sortOrder: number
      workSessionId?: string | null
    }[],
  ): Promise<void> {
    if (tasks.length === 0) return
    await this.db.insert(dailyReportTasks).values(
      tasks.map((t) => ({
        dailyReportId: reportId,
        workSessionId: t.workSessionId ?? null,
        taskType: t.taskType,
        taskName: t.taskName,
        hours: t.hours != null ? String(t.hours) : null,
        sortOrder: t.sortOrder,
      })),
    )
  }

  async findReportByUserAndDate(userId: string, date: string): Promise<{ id: string } | null> {
    const result = await this.db
      .select({ id: dailyReports.id })
      .from(dailyReports)
      .where(and(eq(dailyReports.userId, userId), eq(dailyReports.date, date)))
      .limit(1)
    return result[0] ?? null
  }

  async findReportSummary(
    userId: string,
    date: string,
  ): Promise<{ summary: string | null; issues: string | null; notes: string | null } | null> {
    const result = await this.db
      .select({
        summary: dailyReports.summary,
        issues: dailyReports.issues,
        notes: dailyReports.notes,
      })
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.userId, userId),
          eq(dailyReports.date, date),
          isNotNull(dailyReports.submittedAt),
        ),
      )
      .limit(1)
    return result[0] ?? null
  }

  async updateReport(
    reportId: string,
    fields: {
      summary?: string | null
      issues?: string | null
      notes?: string | null
      submittedAt?: string
      updatedAt?: string
    },
  ): Promise<void> {
    const updateData: Record<string, unknown> = {}
    if (fields.summary !== undefined) updateData.summary = fields.summary
    if (fields.issues !== undefined) updateData.issues = fields.issues
    if (fields.notes !== undefined) updateData.notes = fields.notes
    if (fields.submittedAt !== undefined) updateData.submittedAt = fields.submittedAt
    if (fields.updatedAt !== undefined) updateData.updatedAt = fields.updatedAt

    await this.db.update(dailyReports).set(updateData).where(eq(dailyReports.id, reportId))
  }

  async findTasksBySession(reportId: string, workSessionId: string, taskType: string) {
    const result = await this.db
      .select({
        id: dailyReportTasks.id,
        taskType: dailyReportTasks.taskType,
        taskName: dailyReportTasks.taskName,
        hours: dailyReportTasks.hours,
        sortOrder: dailyReportTasks.sortOrder,
      })
      .from(dailyReportTasks)
      .where(
        and(
          eq(dailyReportTasks.dailyReportId, reportId),
          eq(dailyReportTasks.workSessionId, workSessionId),
          eq(dailyReportTasks.taskType, taskType),
        ),
      )
      .orderBy(asc(dailyReportTasks.sortOrder))

    return result.map((t) => ({
      ...t,
      hours: t.hours != null ? Number(t.hours) : null,
    }))
  }

  async findPreviousSessionActualTasks(reportId: string, currentSessionId: string) {
    const result = await this.db
      .select({
        taskName: dailyReportTasks.taskName,
        hours: dailyReportTasks.hours,
        workSessionId: dailyReportTasks.workSessionId,
      })
      .from(dailyReportTasks)
      .where(
        and(
          eq(dailyReportTasks.dailyReportId, reportId),
          eq(dailyReportTasks.taskType, "actual"),
          ne(dailyReportTasks.workSessionId, currentSessionId),
        ),
      )
      .orderBy(asc(dailyReportTasks.sortOrder))

    return result.map((t) => ({
      ...t,
      hours: t.hours != null ? Number(t.hours) : null,
    }))
  }

  async findReportsByDateRange(userId: string, startDate: string, endDate: string) {
    return this.db.query.dailyReports.findMany({
      where: and(
        eq(dailyReports.userId, userId),
        gte(dailyReports.date, startDate),
        lte(dailyReports.date, endDate),
      ),
      orderBy: [asc(dailyReports.date)],
      columns: {
        id: true,
        userId: true,
        date: true,
        issues: true,
        submittedAt: true,
      },
      with: {
        tasks: {
          columns: {
            id: true,
            taskType: true,
          },
        },
      },
    })
  }

  async findReportWithTasks(reportId: string) {
    const result = await this.db.query.dailyReports.findFirst({
      where: eq(dailyReports.id, reportId),
      with: {
        tasks: {
          columns: {
            id: true,
            taskType: true,
            taskName: true,
            hours: true,
            sortOrder: true,
          },
        },
      },
    })

    if (!result) {
      throw new DatabaseError("Report not found")
    }

    return {
      ...result,
      tasks: result.tasks.map((t) => ({
        ...t,
        hours: t.hours != null ? Number(t.hours) : null,
      })),
    }
  }

  async findSubmittedReportsByDate(date: string) {
    return this.db.query.dailyReports.findMany({
      where: and(eq(dailyReports.date, date), isNotNull(dailyReports.submittedAt)),
      orderBy: [asc(dailyReports.date)],
      columns: {
        id: true,
        userId: true,
        date: true,
        issues: true,
        submittedAt: true,
      },
      with: {
        profile: {
          columns: {
            name: true,
            employeeNumber: true,
          },
        },
        tasks: {
          columns: {
            id: true,
            taskType: true,
          },
        },
      },
    })
  }

  async findAllTasksByReportAndType(reportId: string, taskType: string) {
    const result = await this.db
      .select({
        taskName: dailyReportTasks.taskName,
        hours: dailyReportTasks.hours,
      })
      .from(dailyReportTasks)
      .where(
        and(eq(dailyReportTasks.dailyReportId, reportId), eq(dailyReportTasks.taskType, taskType)),
      )
      .orderBy(asc(dailyReportTasks.sortOrder))

    return result.map((t) => ({
      taskName: t.taskName,
      hours: t.hours != null ? Number(t.hours) : null,
    }))
  }
}
