// /routes/auth/register.ts
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { getSupabaseClient } from "../../lib/supabase";

type Env = {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
};

const authRegister = new Hono<{ Bindings: Env }>;

authRegister.post("/", async (c) => {
    const supabase = getSupabaseClient(c.env);
    const { email, password, name } = await c.req.json();

    // ① パスワードをハッシュ化（bcryptjs）
    const hashed = await bcrypt.hash(password, 10);

    const employeeNumber = crypto.randomUUID().slice(0, 8); // 任意生成

    // ② DBに保存（hashed_password として保存）
    const { data, error } = await supabase
        .from("users")
        .insert({
            email,
            name,
            hashed_password: hashed,
            employee_number: employeeNumber,  // ← 追加
            role: "user",                     // あるなら
        })
        .select("*")
        .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ user: data });
});

export default authRegister;