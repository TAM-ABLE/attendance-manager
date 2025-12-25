// backend/src/routes/attendance/clock.ts
import { Hono } from "hono";
import { getSupabaseClient } from "../../../lib/supabase";
import { todayJSTString } from "../../../lib/time";
import { getSlackConfig, sendClockInNotification, sendClockOutNotification } from "../../../lib/slack";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { clockInRequestSchema, clockOutRequestSchema, type ClockInRequest, type ClockOutRequest, type TaskInput } from "../../../lib/schemas";
import { successResponse, databaseError, validationError } from "../../../lib/errors";

const clockRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// POST /attendance/clock-in
clockRouter.post("/clock-in", validateBody(clockInRequestSchema), async (c) => {
    const { id: userId } = c.get("jwtPayload");
    const { userName, plannedTasks } = c.get("validatedBody") as ClockInRequest;

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

    // 2. work_session を作成
    const { error: sessionErr } = await supabase.from("work_sessions").insert({
        attendance_id: attendanceId,
        clock_in: new Date().toISOString(),
    });

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
        const taskInserts = plannedTasks.map((task: TaskInput, index: number) => ({
            daily_report_id: dailyReport.id,
            task_type: "planned",
            task_name: task.taskName,
            hours: task.hours,
            sort_order: index,
        }));

        const { error: tasksErr } = await supabase.from("daily_report_tasks").insert(taskInserts);

        if (tasksErr) {
            console.error("Failed to insert planned tasks:", tasksErr);
            // タスク保存失敗は致命的ではないので続行
        }
    }

    // 4. Slack に通知を送信
    const slackConfig = getSlackConfig(c.env);
    const slackResult = await sendClockInNotification(slackConfig, userName, plannedTasks);

    return successResponse(c, { slack_ts: slackResult.ts });
});

// POST /attendance/clock-out
clockRouter.post("/clock-out", validateBody(clockOutRequestSchema), async (c) => {
    const { id: userId } = c.get("jwtPayload");
    const { userName, actualTasks, summary, issues, notes } = c.get("validatedBody") as ClockOutRequest;

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

    // 2. アクティブなセッションを取得
    const { data: session, error: sessionErr } = await supabase
        .from("work_sessions")
        .select("id")
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

    // 3. 退勤時刻を記録
    const { error: updateErr } = await supabase
        .from("work_sessions")
        .update({ clock_out: new Date().toISOString() })
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
            const taskInserts = actualTasks.map((task: TaskInput, index: number) => ({
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

    // 5. Slack に通知を送信
    const slackConfig = getSlackConfig(c.env);
    const slackResult = await sendClockOutNotification(slackConfig, userName, actualTasks, {
        summary,
        issues,
        notes,
    });

    return successResponse(c, { slack_ts: slackResult.ts });
});

export default clockRouter;
