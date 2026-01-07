// backend/src/routes/attendance/clock.ts
import { createRoute } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../../lib/supabase";
import { todayJSTString } from "@attendance-manager/shared/lib/time";
import { getSlackConfig, sendClockInNotification, sendClockOutNotification } from "../../../lib/slack";
import { databaseError, validationError, successResponse } from "../../../lib/errors";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import {
    clockInRequestSchema,
    clockOutRequestSchema,
    clockResponseSchema,
    errorResponseSchema,
    successResponseSchema,
    type Task,
} from "../../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const clockRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

// POST /attendance/clock-in
const clockInRoute = createRoute({
    method: "post",
    path: "/clock-in",
    tags: ["勤怠"],
    summary: "出勤",
    description: "出勤を記録し、Slack通知を送信します。",
    security: [{ Bearer: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: clockInRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(clockResponseSchema),
                },
            },
            description: "出勤成功",
        },
        400: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "バリデーションエラー",
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

clockRouter.openapi(clockInRoute, async (c) => {
    const { sub: userId } = c.get("jwtPayload");
    const { userName, plannedTasks, clockInTime } = c.req.valid("json");

    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 1. attendance_record を取得または作成
    const { data: record, error: recordErr } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

    if (recordErr) {
        return databaseError(c, recordErr.message);
    }

    let attendanceId = record?.id;

    if (!attendanceId) {
        const { data: newRecord, error: newRecordErr } = await supabase
            .from("attendance_records")
            .insert({ user_id: userId, date })
            .select("id")
            .single();

        if (newRecordErr) {
            return databaseError(c, newRecordErr.message);
        }

        attendanceId = newRecord.id;
    }

    // 2. work_session を作成（clockInTimeが指定されていればそれを使用、なければ現在時刻）
    const { data: session, error: sessionErr } = await supabase
        .from("work_sessions")
        .insert({
            attendance_id: attendanceId,
            clock_in: clockInTime ?? new Date().toISOString(),
        })
        .select("id")
        .single();

    if (sessionErr) {
        return databaseError(c, sessionErr.message);
    }

    // 3. 日報を作成し、予定タスクを保存
    const { data: dailyReport, error: reportErr } = await supabase
        .from("daily_reports")
        .insert({ user_id: userId, date })
        .select("id")
        .single();

    if (reportErr) {
        return databaseError(c, reportErr.message);
    }

    if (plannedTasks.length > 0) {
        const taskInserts = plannedTasks.map((task: Task, index: number) => ({
            daily_report_id: dailyReport.id,
            task_type: "planned",
            task_name: task.taskName,
            hours: task.hours,
            sort_order: index,
        }));

        const { error: tasksErr } = await supabase.from("daily_report_tasks").insert(taskInserts);

        if (tasksErr) {
            // タスク保存失敗は警告として記録するが、出勤処理は成功扱い
            console.error("Failed to insert planned tasks:", tasksErr);
        }
    }

    // 4. Slack に通知を送信
    const slackConfig = getSlackConfig(c.env);
    const slackResult = await sendClockInNotification(slackConfig, userName, plannedTasks);

    // 5. Slackメッセージのtsをwork_sessionに保存（スレッド返信用）
    if (slackResult.ts) {
        const { error: updateTsErr } = await supabase
            .from("work_sessions")
            .update({ slack_clock_in_ts: slackResult.ts })
            .eq("id", session.id);

        if (updateTsErr) {
            console.error("Failed to save slack_clock_in_ts:", updateTsErr);
        }
    }

    return successResponse(c, { slack_ts: slackResult.ts });
});

// POST /attendance/clock-out
const clockOutRoute = createRoute({
    method: "post",
    path: "/clock-out",
    tags: ["勤怠"],
    summary: "退勤",
    description: "退勤を記録し、日報を提出し、Slack通知を送信します。",
    security: [{ Bearer: [] }],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: clockOutRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(clockResponseSchema),
                },
            },
            description: "退勤成功",
        },
        400: {
            content: {
                "application/json": {
                    schema: errorResponseSchema,
                },
            },
            description: "バリデーションエラー",
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

clockRouter.openapi(clockOutRoute, async (c) => {
    const { sub: userId } = c.get("jwtPayload");
    const { userName, actualTasks, summary, issues, notes, clockOutTime } = c.req.valid("json");

    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 1. 今日のattendance_recordを取得
    const { data: record, error: recordErr } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

    if (recordErr) {
        return databaseError(c, recordErr.message);
    }

    if (!record) {
        return validationError(c, "No attendance record for today");
    }

    const attendanceId = record.id;

    // 2. アクティブなセッションを取得（slack_clock_in_tsも取得してスレッド返信に使用）
    const { data: session, error: sessionErr } = await supabase
        .from("work_sessions")
        .select("id, slack_clock_in_ts")
        .eq("attendance_id", attendanceId)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (sessionErr) {
        return databaseError(c, sessionErr.message);
    }

    if (!session) {
        return validationError(c, "No active session to clock out");
    }

    // 3. 退勤時刻を記録（clockOutTimeが指定されていればそれを使用、なければ現在時刻）
    const { error: updateErr } = await supabase
        .from("work_sessions")
        .update({ clock_out: clockOutTime ?? new Date().toISOString() })
        .eq("id", session.id);

    if (updateErr) {
        return databaseError(c, updateErr.message);
    }

    // 4. 日報を更新し、実績タスクを保存
    const { data: dailyReport, error: reportFetchErr } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .is("submitted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (reportFetchErr) {
        // 日報取得失敗は警告として記録するが、退勤処理は続行
        console.error("Failed to fetch daily report:", reportFetchErr);
    }

    if (dailyReport) {
        const { error: reportUpdateErr } = await supabase
            .from("daily_reports")
            .update({
                summary: summary || null,
                issues: issues || null,
                notes: notes || null,
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", dailyReport.id);

        if (reportUpdateErr) {
            console.error("Failed to update daily report:", reportUpdateErr);
        }

        if (actualTasks.length > 0) {
            const taskInserts = actualTasks.map((task: Task, index: number) => ({
                daily_report_id: dailyReport.id,
                task_type: "actual",
                task_name: task.taskName,
                hours: task.hours,
                sort_order: index,
            }));

            const { error: tasksErr } = await supabase.from("daily_report_tasks").insert(taskInserts);

            if (tasksErr) {
                console.error("Failed to insert actual tasks:", tasksErr);
            }
        }
    }

    // 5. Slack に通知を送信（出勤メッセージのスレッドに返信）
    const slackConfig = getSlackConfig(c.env);
    const slackResult = await sendClockOutNotification(slackConfig, userName, actualTasks, {
        summary,
        issues,
        notes,
        threadTs: session.slack_clock_in_ts ?? undefined,
    });

    return successResponse(c, { slack_ts: slackResult.ts });
});

export default clockRouter;
