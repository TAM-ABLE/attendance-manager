import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
    try {
        // 1. NextAuth セッションからトークンを取得
        const session = await getServerSession(authOptions);
        const token = session?.user?.apiToken;

        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // 2. クエリパラメータを取得
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const date = url.searchParams.get("date");

        if (!userId || !date) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
        }

        // 3. 外部 API を叩く
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/database/attendance/get-user-date-work-sessions?userId=${userId}&date=${date}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        let data;
        try {
            data = await res.json();
        } catch (err) {
            console.error("Failed to parse backend response:", err);
            data = { error: "Invalid response from backend" };
        }

        // data が配列じゃなければ空にする
        return new Response(
            JSON.stringify(Array.isArray(data) ? data : []),
            { status: res.status }
        );


    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), { status: 500 });
    }
}