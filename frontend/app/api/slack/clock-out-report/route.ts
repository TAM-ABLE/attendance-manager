// frontend/app/api/slack/clock-out-report/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
    try {
        // 1. NextAuth セッションからトークンを取得
        const session = await getServerSession(authOptions);
        const token = session?.user?.apiToken;

        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // 2. Body から更新内容を取得
        const body = await request.json();
        const { actualTasks, summary, issues, notes } = body;

        if (!actualTasks) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
        }

        const userName = "ダミーさん";

        // 3. 外部 API に JSON ボディとして渡す
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/slack/clock-out-report`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userName, actualTasks, summary, issues, notes }),
            }
        );

        let data;
        try {
            data = await res.json();
        } catch {
            data = { error: "Invalid response from backend" };
        }

        return new Response(JSON.stringify(data), { status: res.status });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), { status: 500 });
    }
}
