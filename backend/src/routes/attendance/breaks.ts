// backend/src/routes/attendance/breaks.ts
import { createRoute, z } from "@hono/zod-openapi";
import { getSupabaseClient } from "../../../lib/supabase";
import { todayJSTString } from "@attendance-manager/shared/lib/time";
import { databaseError, validationError, successResponse } from "../../../lib/errors";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { errorResponseSchema, successResponseSchema } from "../../../lib/openapi-schemas";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const breaksRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

const nullResponseSchema = z.null().openapi({ description: "null" });

// POST /attendance/breaks/start
const breakStartRoute = createRoute({
    method: "post",
    path: "/start",
    tags: ["勤怠"],
    summary: "休憩開始",
    description: "休憩を開始します。",
    security: [{ Bearer: [] }],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(nullResponseSchema),
                },
            },
            description: "休憩開始成功",
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

breaksRouter.openapi(breakStartRoute, async (c) => {
    const { sub: userId } = c.get("jwtPayload");
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 1. 今日の attendance_record を取得
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

    // 2. clock_out が null の最新 session を取得
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
        return validationError(c, "No active session");
    }

    const sessionId = session.id;

    // 3. この session で「未終了 break」 が無いか確認
    const { data: activeBreak, error: breakErr } = await supabase
        .from("breaks")
        .select("id")
        .eq("session_id", sessionId)
        .is("break_end", null)
        .maybeSingle();

    if (breakErr) {
        return databaseError(c, breakErr.message);
    }

    if (activeBreak) {
        return validationError(c, "Break already in progress");
    }

    // 4. break_start レコードを作成
    const { error: insertErr } = await supabase.from("breaks").insert({
        session_id: sessionId,
        break_start: new Date().toISOString(),
    });

    if (insertErr) {
        return databaseError(c, insertErr.message);
    }

    return successResponse(c, null);
});

// POST /attendance/breaks/end
const breakEndRoute = createRoute({
    method: "post",
    path: "/end",
    tags: ["勤怠"],
    summary: "休憩終了",
    description: "休憩を終了します。",
    security: [{ Bearer: [] }],
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: successResponseSchema(nullResponseSchema),
                },
            },
            description: "休憩終了成功",
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

breaksRouter.openapi(breakEndRoute, async (c) => {
    const { sub: userId } = c.get("jwtPayload");
    const supabase = getSupabaseClient(c.env);
    const date = todayJSTString();

    // 1. 今日の attendance_record を取得
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

    // 2. active session（clock_out が null）の最新 1つ取得
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
        return validationError(c, "No active session");
    }

    const sessionId = session.id;

    // 3. break_end が null の「現在の break」を取得
    const { data: activeBreak, error: breakErr } = await supabase
        .from("breaks")
        .select("id")
        .eq("session_id", sessionId)
        .is("break_end", null)
        .order("break_start", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (breakErr) {
        return databaseError(c, breakErr.message);
    }

    if (!activeBreak) {
        return validationError(c, "No active break to end");
    }

    // 4. break_end を埋める
    const { error: updateErr } = await supabase
        .from("breaks")
        .update({ break_end: new Date().toISOString() })
        .eq("id", activeBreak.id);

    if (updateErr) {
        return databaseError(c, updateErr.message);
    }

    return successResponse(c, null);
});

export default breaksRouter;
