// backend/src/routes/daily-reports.ts
import { createRoute, z } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../lib/supabase";
import { parseYearMonth } from "@attendance-manager/shared/lib/time";
import { databaseError, notFoundError, validationError, successResponse } from "../../lib/errors";
import { Env } from "../types/env";
import { AuthVariables } from "../middleware/auth";
import { DailyReport, DailyReportListItem, DailyReportTask, UserForSelect } from "@attendance-manager/shared/types/DailyReport";
import {
    usersForSelectResponseSchema,
    dailyReportListResponseSchema,
    dailyReportDetailResponseSchema,
    uuidSchema,
    yearMonthSchema,
    errorResponseSchema,
    successResponseSchema,
} from "../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../lib/openapi-hono";

const dailyReportsRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

// GET /daily-reports/users - ユーザー一覧取得（ユーザー選択用）
const getUsersRoute = createRoute({
    method: "get",
    path: "/users",
    tags: ["日報"],
    summary: "ユーザー一覧取得（日報用）",
    description: "日報閲覧用のユーザー一覧を取得します。",
    security: [{ Bearer: [] }],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(usersForSelectResponseSchema),
                },
            },
            description: "取得成功",
        },
        500: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "サーバーエラー",
        },
    },
});

dailyReportsRouter.openapi(getUsersRoute, async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from("profiles")
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

    return successResponse(c, users);
});

// GET /daily-reports/user/:userId/month/:yearMonth - 特定ユーザーの月別日報一覧取得
const getUserMonthlyReportsRoute = createRoute({
    method: "get",
    path: "/user/{userId}/month/{yearMonth}",
    tags: ["日報"],
    summary: "ユーザーの月別日報一覧取得",
    description: "指定ユーザーの月別日報一覧を取得します。",
    security: [{ Bearer: [] }],
    request: {
        params: z.object({
            userId: uuidSchema,
            yearMonth: yearMonthSchema,
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(dailyReportListResponseSchema),
                },
            },
            description: "取得成功",
        },
        400: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "バリデーションエラー",
        },
        404: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "ユーザーが見つかりません",
        },
        500: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "サーバーエラー",
        },
    },
});

dailyReportsRouter.openapi(getUserMonthlyReportsRoute, async (c) => {
    const { userId, yearMonth } = c.req.valid("param");

    const parsed = parseYearMonth(yearMonth);
    if (!parsed) {
        return validationError(c, "Invalid year-month format");
    }
    const { year, month } = parsed;

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const supabase = getSupabaseClient(c.env);

    // ユーザー情報を先に取得
    const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, name, employee_number")
        .eq("id", userId)
        .single();

    if (userError) {
        return notFoundError(c, "User");
    }

    // 日報一覧を取得
    const { data: reports, error: reportsError } = await supabase
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
        `
        )
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: true });

    if (reportsError) {
        return databaseError(c, reportsError.message);
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
const getReportDetailRoute = createRoute({
    method: "get",
    path: "/{id}",
    tags: ["日報"],
    summary: "日報詳細取得",
    description: "指定された日報の詳細を取得します。",
    security: [{ Bearer: [] }],
    request: {
        params: z.object({
            id: uuidSchema,
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(dailyReportDetailResponseSchema),
                },
            },
            description: "取得成功",
        },
        404: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "日報が見つかりません",
        },
        500: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "サーバーエラー",
        },
    },
});

dailyReportsRouter.openapi(getReportDetailRoute, async (c) => {
    const { id } = c.req.valid("param");
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

    return successResponse(c, dailyReport);
});

export default dailyReportsRouter;
