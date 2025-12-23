// backend/src/routes/get-user-date-work-sessions.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import type { Database } from '../types/supabase';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';

// DB row 型
type DbRecord = Database["public"]["Tables"]["attendance_records"]["Row"] & {
    work_sessions: Array<
        Database["public"]["Tables"]["work_sessions"]["Row"] & {
            breaks: Database["public"]["Tables"]["breaks"]["Row"][];
        }
    >;
};

const getUserDateWorkSessionsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

getUserDateWorkSessionsRouter.get("/", async (c) => {
    // クエリ取得
    const userId = c.req.query("userId");
    const date = c.req.query("date");

    if (!userId || !date) {
        return c.json({ error: "Missing parameters" }, 400);
    }

    const supabase = getSupabaseClient(c.env);

    // --- 3. DB 取得 ---
    const { data, error } = await supabase
        .from("attendance_records")
        .select(
            `
      id,
      date,
      work_sessions (
        id,
        clock_in,
        clock_out,
        breaks (
          id,
          break_start,
          break_end
        )
      )
    `
        )
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle<DbRecord>();

    if (error) {
        console.error(error);
        return c.json({ error: "DB error" }, 500);
    }

    // --- 4. 整形（WorkSession[]） ---
    if (!data?.work_sessions || !Array.isArray(data.work_sessions)) {
        return c.json([], 200);
    }

    const sessions = data.work_sessions.map((s) => ({
        id: s.id,
        clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
        clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
        breaks: s.breaks.map((b) => ({
            id: b.id,
            start: b.break_start ? new Date(b.break_start).getTime() : null,
            end: b.break_end ? new Date(b.break_end).getTime() : null,
        })),
    }));

    return c.json(sessions, 200);
});

export default getUserDateWorkSessionsRouter;
