// backend/src/routes/database.ts
import { Hono } from "hono";
import { getSupabaseClient } from "../lib/supabase";
import { cors } from 'hono/cors'

const database = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string } }>();

database.use('*', cors())

async function getOrCreateAttendance(supabase: ReturnType<typeof getSupabaseClient>, userId: string, date: string) {
    const { data: existing } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .limit(1)
        .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
        .from("attendance_records")
        .insert({ user_id: userId, date })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// clock-in
database.post("/clock-in", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const userId = body.userId as string;
    const date = body.date as string;
    const clockIn = body.clockIn ?? new Date().toISOString();

    try {
        const attendance = await getOrCreateAttendance(supabase, userId, date);
        const { data, error } = await supabase
            .from("work_sessions")
            .insert({
                attendance_id: attendance.id,
                clock_in: clockIn,
            })
            .select()
            .single();

        if (error) throw error;
        return c.json({ ok: true, session: data });
    } catch (err) {
        console.error(err);
        return c.json({ error: (err as any).message || err }, 500);
    }
});

// clock-out
database.post("/clock-out", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const sessionId = body.sessionId as string;
    const clockOut = body.clockOut ?? new Date().toISOString();

    try {
        const { error } = await supabase
            .from("work_sessions")
            .update({ clock_out: clockOut })
            .eq("id", sessionId);

        if (error) throw error;
        return c.json({ ok: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: (err as any).message || err }, 500);
    }
});

// break-start
database.post("/break-start", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const sessionId = body.sessionId as string;
    const breakStart = body.breakStart ?? new Date().toISOString();

    try {
        const { data, error } = await supabase
            .from("breaks")
            .insert({ session_id: sessionId, break_start: breakStart })
            .select()
            .single();

        if (error) throw error;
        return c.json({ ok: true, break: data });
    } catch (err) {
        console.error(err);
        return c.json({ error: (err as any).message || err }, 500);
    }
});

// break-end
database.post("/break-end", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const body = await c.req.json();
    const breakId = body.breakId as string;
    const breakEnd = body.breakEnd ?? new Date().toISOString();

    try {
        const { error } = await supabase
            .from("breaks")
            .update({ break_end: breakEnd })
            .eq("id", breakId);

        if (error) throw error;
        return c.json({ ok: true });
    } catch (err) {
        console.error(err);
        return c.json({ error: (err as any).message || err }, 500);
    }
});

database.get("/attendance", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const userId = c.req.query("userId");
    const date = c.req.query("date");

    if (!userId || !date) {
        return c.json({ error: "Missing userId or date" }, 400);
    }

    const { data, error } = await supabase
        .from("attendance_records")
        .select(`*, work_sessions(*, breaks(*))`)
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data ?? null);
});


export default database;