// frontend/proxy.ts
// Cookie から Authorization ヘッダーへの変換 + Hono API へのリライト

import { NextResponse, NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export function proxy(request: NextRequest) {
    // /api/proxy/* へのリクエストを Hono にリライト
    if (request.nextUrl.pathname.startsWith("/api/proxy/")) {
        const accessToken = request.cookies.get("accessToken")?.value;
        const targetPath = request.nextUrl.pathname.replace("/api/proxy", "");
        const url = new URL(targetPath + request.nextUrl.search, API_URL);

        const requestHeaders = new Headers(request.headers);
        if (accessToken) {
            requestHeaders.set("Authorization", `Bearer ${accessToken}`);
        }
        requestHeaders.delete("cookie");

        return NextResponse.rewrite(url, {
            request: { headers: requestHeaders },
        });
    }
}

export const config = {
    matcher: "/api/proxy/:path*",
};
