import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証が必要なルート
const protectedRoutes = ["/dashboard", "/admin", "/attendance-history", "/report-list"];

// 認証済みユーザーがアクセスすべきでないルート
const authRoutes = ["/login", "/sign-up"];

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });
    const { pathname } = request.nextUrl;

    // 認証が必要なルートへのアクセス
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    if (isProtectedRoute && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 認証済みユーザーがログイン/サインアップページにアクセス
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/attendance-history/:path*", "/report-list/:path*", "/login", "/sign-up"],
};
