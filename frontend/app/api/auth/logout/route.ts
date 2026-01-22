// frontend/app/api/auth/logout/route.ts
// ログアウト用 Route Handler
// Cookie を削除してログアウト

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Cookie を削除
    cookieStore.delete("accessToken")

    return NextResponse.json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    })
  } catch (err) {
    console.error("Logout route error:", err)
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "ログアウトに失敗しました" },
      },
      { status: 500 },
    )
  }
}
