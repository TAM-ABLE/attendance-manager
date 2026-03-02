import { and, asc, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm"
import type { Db } from "../../db"
import { dailyReports, dailyReportTasks } from "../../db/schema"
import { DatabaseError } from "./errors"

export class DailyReportRepository {
  constructor(private db: Db) {}

  async createReport(userId: string, date: string): Promise<{ id: string }> {
    const [result] = await this.db
      .insert(dailyReports)
      .values({ userId, date })
      .returning({ id: dailyReports.id })
    return result
  }

  async insertTasks(
    reportId: string,
    tasks: { taskType: string; taskName: string; hours: number | null; sortOrder: number }[],
  ): Promise<void> {
    if (tasks.length === 0) return
    await this.db.insert(dailyReportTasks).values(
      tasks.map((t) => ({
        dailyReportId: reportId,
        taskType: t.taskType,
        taskName: t.taskName,
        hours: t.hours != null ? String(t.hours) : null,
        sortOrder: t.sortOrder,
      })),
    )
  }

  async findUnsubmittedReport(userId: string, date: string): Promise<{ id: string } | null> {
    const result = await this.db
      .select({ id: dailyReports.id })
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.userId, userId),
          eq(dailyReports.date, date),
          isNull(dailyReports.submittedAt),
        ),
      )
      .orderBy(desc(dailyReports.createdAt))
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

  async findUnsubmittedReportWithTasks(userId: string, date: string) {
    const result = await this.db.query.dailyReports.findFirst({
      where: and(
        eq(dailyReports.userId, userId),
        eq(dailyReports.date, date),
        isNull(dailyReports.submittedAt),
      ),
      orderBy: [desc(dailyReports.createdAt)],
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

    if (!result) return null

    return {
      ...result,
      tasks: result.tasks.map((t) => ({
        ...t,
        hours: t.hours != null ? Number(t.hours) : null,
      })),
    }
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
      orderBy: [desc(dailyReports.submittedAt)],
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
}
