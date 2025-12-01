// backend/src/routes/database/attendance/update-user-date-work-sessions.ts

import { Hono } from "hono";
import { verify } from "hono/jwt";
import { getSupabaseClient } from "../../../../lib/supabase";

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const attendanceUpdateUserDateSessions = new Hono<{ Bindings: Env }>();

attendanceUpdateUserDateSessions.put("/", async (c) => {

    // --- 1. Authorization ---
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let payload: { id: string; role: 'admin' | 'user' };

    try {
        payload = await verify(token, c.env.JWT_SECRET) as { id: string; role: 'admin' | 'user' };
    } catch {
        return c.json({ error: "Invalid token" }, 401);
    }

    // --- 管理者のみ更新可能 ---
    if (payload.role !== "admin") {
        return c.json({ error: "Forbidden (admin only)" }, 403);
    }

    // --- 2. Body ---
    const { userId, date, sessions } = await c.req.json();

    if (!userId || !date || !sessions) {
        return c.json({ error: "Missing parameters" }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // --- 3. attendance_records を取得 or 作成 ---
    const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

    let attendanceId: string;

    if (attendanceData) {
        attendanceId = attendanceData.id;

        // 既存データ削除
        const { data: oldSessions } = await supabase
            .from("work_sessions")
            .select("id")
            .eq("attendance_id", attendanceId);

        const ids = oldSessions?.map((s) => s.id) || [];

        if (ids.length > 0) {
            await supabase.from("breaks").delete().in("session_id", ids);
            await supabase.from("work_sessions").delete().in("id", ids);
        }
    } else {
        const { data: newRecord, error: err } = await supabase
            .from("attendance_records")
            .insert({ user_id: userId, date })
            .select()
            .single();

        if (err || !newRecord) {
            return c.json({ error: "Failed to create attendance" }, 500);
        }

        attendanceId = newRecord.id;
    }

    // --- 4. 新しい work_sessions を登録 ---
    for (const s of sessions) {
        if (!s.clockIn) continue;

        const { data: ws, error: wsErr } = await supabase
            .from("work_sessions")
            .insert({
                attendance_id: attendanceId,
                clock_in: new Date(s.clockIn).toISOString(),
                clock_out: s.clockOut ? new Date(s.clockOut).toISOString() : null,
            })
            .select()
            .single();

        if (wsErr || !ws) {
            return c.json({ error: "Failed to insert session" }, 500);
        }

        for (const br of s.breaks) {
            if (!br.start) continue;

            const { error: brErr } = await supabase.from("breaks").insert({
                session_id: ws.id,
                break_start: new Date(br.start).toISOString(),
                break_end: br.end ? new Date(br.end).toISOString() : null,
            });

            if (brErr) {
                return c.json({ error: "Failed to insert break" }, 500);
            }
        }
    }

    return c.json({ ok: true });
});

export default attendanceUpdateUserDateSessions;
