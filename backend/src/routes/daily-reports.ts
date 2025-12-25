// backend/src/routes/daily-reports.ts
import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseClient } from "../../lib/supabase";
import { parseYearMonth } from "../../lib/time";
import { Env } from "../types/env";
import { AuthVariables } from "../middleware/auth";
import { DailyReport, DailyReportListItem, DailyReportTask, UserForSelect } from "../../../shared/types/DailyReport";
import { successResponse, databaseError, notFoundError, validationError } from "../../lib/errors";
import { validateParams } from "../middleware/validation";
import { uuidSchema, yearMonthParamsSchema } from "../../lib/schemas";

const dailyReportsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// パラメータスキーマ
const userMonthParamsSchema = z.object({
    userId: uuidSchema,
    yearMonth: yearMonthParamsSchema.shape.yearMonth,
});

const reportIdParamsSchema = z.object({
    id: uuidSchema,
});

// GET /daily-reports/users - ユーザー一覧取得（ユーザー選択用）
dailyReportsRouter.get("/users", async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from("users")
        .select("id, name, employee_number")
        .order("employee_number", { ascending: true });

    if (error) {
        return databaseError(c, error.message);
    }

    const users: UserForSelect[] = data.map((user) => ({
        id: user.id,
        name: user.name,
        employeeNumber: user.employee_number,
    }));

    return successResponse(c, { users });
});

// GET /daily-reports/user/:userId/month/:yearMonth - 特定ユーザーの月別日報一覧取得
dailyReportsRouter.get("/user/:userId/month/:yearMonth", validateParams(userMonthParamsSchema), async (c) => {
    const { userId, yearMonth } = c.get("validatedParams") as { userId: string; yearMonth: string };

    const parsed = parseYearMonth(yearMonth);
    if (!parsed) {
        return validationError(c, "Invalid year-month format");
    }
    const { year, month } = parsed;

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const supabase = getSupabaseClient(c.env);

    // 日報一覧とユーザー情報を1クエリで取得 (N+1解消)
    const { data: reports, error: reportsError } = await supabase
        .from("daily_reports")
        .select(
            `
            id,
            user_id,
            date,
            submitted_at,
            users!inner (
                id,
                name,
                employee_number
            ),
            daily_report_tasks (
                id,
                task_type
            )
        `
        )
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: true });

    if (reportsError) {
        // ユーザーが見つからない場合
        if (reportsError.code === "PGRST116") {
            return notFoundError(c, "User");
        }
        return databaseError(c, reportsError.message);
    }

    // ユーザー情報を取得（日報がない場合でもユーザー情報を返すため）
    let userData: { id: string; name: string; employee_number: string } | null = null;

    if (reports && reports.length > 0) {
        const firstReport = reports[0] as { users: { id: string; name: string; employee_number: string } };
        userData = firstReport.users;
    } else {
        // 日報がない場合、ユーザー情報を別途取得
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, name, employee_number")
            .eq("id", userId)
            .single();

        if (userError) {
            return notFoundError(c, "User");
        }
        userData = user;
    }

    const reportList: DailyReportListItem[] = (reports || []).map((report) => {
        const tasks = (report as { daily_report_tasks: { task_type: string }[] }).daily_report_tasks || [];
        const plannedCount = tasks.filter((t) => t.task_type === "planned").length;
        const actualCount = tasks.filter((t) => t.task_type === "actual").length;

        return {
            id: report.id,
            userId: report.user_id,
            userName: userData!.name,
            employeeNumber: userData!.employee_number,
            date: report.date,
            submittedAt: report.submitted_at ? new Date(report.submitted_at).getTime() : null,
            plannedTaskCount: plannedCount,
            actualTaskCount: actualCount,
        };
    });

    return successResponse(c, {
        user: {
            id: userData!.id,
            name: userData!.name,
            employeeNumber: userData!.employee_number,
        },
        yearMonth,
        reports: reportList,
    });
});

// GET /daily-reports/:id - 日報詳細取得
dailyReportsRouter.get("/:id", validateParams(reportIdParamsSchema), async (c) => {
    const { id } = c.get("validatedParams") as { id: string };
    const supabase = getSupabaseClient(c.env);

    // 日報とタスクを取得
    const { data: report, error: reportError } = await supabase
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
        `
        )
        .eq("id", id)
        .single();

    if (reportError) {
        return notFoundError(c, "Daily report");
    }

    const tasks = report.daily_report_tasks || [];
    const plannedTasks: DailyReportTask[] = tasks
        .filter((t: { task_type: string }) => t.task_type === "planned")
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((t: { id: string; task_type: string; task_name: string; hours: number | null; sort_order: number }) => ({
            id: t.id,
            taskType: t.task_type as "planned",
            taskName: t.task_name,
            hours: t.hours,
            sortOrder: t.sort_order,
        }));

    const actualTasks: DailyReportTask[] = tasks
        .filter((t: { task_type: string }) => t.task_type === "actual")
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((t: { id: string; task_type: string; task_name: string; hours: number | null; sort_order: number }) => ({
            id: t.id,
            taskType: t.task_type as "actual",
            taskName: t.task_name,
            hours: t.hours,
            sortOrder: t.sort_order,
        }));

    const dailyReport: DailyReport = {
        id: report.id,
        userId: report.user_id,
        date: report.date,
        summary: report.summary,
        issues: report.issues,
        notes: report.notes,
        submittedAt: report.submitted_at ? new Date(report.submitted_at).getTime() : null,
        plannedTasks,
        actualTasks,
        createdAt: new Date(report.created_at).getTime(),
        updatedAt: new Date(report.updated_at).getTime(),
    };

    return successResponse(c, { report: dailyReport });
});

export default dailyReportsRouter;
