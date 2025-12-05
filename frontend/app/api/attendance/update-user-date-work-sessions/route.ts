// frontend/app/api/attendance/update-user-date-work-sessions/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(request: Request) {
    try {
        // 1. NextAuth セッションからトークンを取得
        const session = await getServerSession(authOptions);
        const token = session?.user?.apiToken;

        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // 2. Body から更新内容を取得
        const body = await request.json();
        const { userId, date, sessions } = body;  // sessions: WorkSession[]

        if (!userId || !date || !sessions) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
        }

        // 3. 外部 API に JSON ボディとして渡す
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/database/attendance/update-user-date-work-sessions`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, date, sessions }),
            }
        );

        let data;
        try {
            data = await res.json();
        } catch (err) {
            console.error("Failed to parse backend response:", err);
            data = { error: "Invalid response from backend" };
        }

        return new Response(JSON.stringify(data), { status: res.status });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), { status: 500 });
    }
}
