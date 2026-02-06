// backend/lib/repositories/daily-report.ts
// 日報データアクセス層

import type { SupabaseClient } from "@supabase/supabase-js"
import { DatabaseError } from "./attendance"

/**
 * 日報Repository
 */
export class DailyReportRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 日報を作成
   */
  async createReport(userId: string, date: string): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("daily_reports")
      .insert({ user_id: userId, date })
      .select("id")
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * タスクを一括挿入
   */
  async insertTasks(
    reportId: string,
    tasks: { taskType: string; taskName: string; hours: number | null; sortOrder: number }[],
  ): Promise<void> {
    if (tasks.length === 0) return

    const inserts = tasks.map((t) => ({
      daily_report_id: reportId,
      task_type: t.taskType,
      task_name: t.taskName,
      hours: t.hours,
      sort_order: t.sortOrder,
    }))

    const { error } = await this.supabase.from("daily_report_tasks").insert(inserts)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * 未提出の日報を取得
   */
  async findUnsubmittedReport(userId: string, date: string): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("daily_reports")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .is("submitted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 日報を更新
   */
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
    if (fields.submittedAt !== undefined) updateData.submitted_at = fields.submittedAt
    if (fields.updatedAt !== undefined) updateData.updated_at = fields.updatedAt

    const { error } = await this.supabase
      .from("daily_reports")
      .update(updateData)
      .eq("id", reportId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * 期間内の日報一覧を取得（タスク数カウント用）
   */
  async findReportsByDateRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from("daily_reports")
      .select(
        `
        id,
        user_id,
        date,
        submitted_at,
        daily_report_tasks (
          id,
          task_type
        )
      `,
      )
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 日報詳細を取得（タスク含む）
   */
  async findReportWithTasks(reportId: string) {
    const { data, error } = await this.supabase
      .from("daily_reports")
      .select(
        `
        id,
        user_id,
        date,
        summary,
        issues,
        notes,
        submitted_at,
        created_at,
        updated_at,
        daily_report_tasks (
          id,
          task_type,
          task_name,
          hours,
          sort_order
        )
      `,
      )
      .eq("id", reportId)
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }
}
