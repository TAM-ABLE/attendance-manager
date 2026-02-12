// lib/auth/server.ts
// Server Component用の認証ユーティリティ
// app.fetch() で直接 Hono アプリを呼び出し（ネットワークラウンドトリップなし）

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import app from "@/server/app"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

/**
 * 現在のユーザーを取得（Server Component用）
 * 認証されていない場合はnullを返す
 * cache()により同一リクエスト内では1回だけAPIを呼ぶ
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) {
    return null
  }

  try {
    const req = new Request("http://localhost/api/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const res = await app.fetch(req, process.env)

    if (!res.ok) {
      return null
    }

    const json = await res.json()

    if (!json.success) {
      return null
    }

    return json.data as AuthUser
  } catch (err) {
    console.error("getUser error:", err)
    return null
  }
})

/**
 * 認証必須ページ用 - 未認証ならログインへリダイレクト
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

/**
 * 一般ユーザー専用ページ用 - 管理者なら管理者画面へリダイレクト
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await requireAuth()

  if (user.role === "admin") {
    redirect("/admin")
  }

  return user
}

/**
 * 管理者専用ページ用 - 管理者でなければダッシュボードへリダイレクト
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (user.role !== "admin") {
    redirect("/dashboard")
  }

  return user
}

/**
 * Server Component用の汎用認証付きfetch
 * app.fetch() で直接 Hono アプリを呼び出す
 * @param endpoint - API エンドポイント（例: "/attendance/today"）
 * @returns データまたはnull（認証エラーやリクエスト失敗時）
 */
export async function fetchWithAuth<T>(endpoint: string): Promise<T | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) {
    return null
  }

  try {
    const req = new Request(`http://localhost/api${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const res = await app.fetch(req, process.env)

    if (!res.ok) {
      return null
    }

    const json = await res.json()

    if (!json.success) {
      return null
    }

    return json.data as T
  } catch (err) {
    console.error("fetchWithAuth error:", err)
    return null
  }
}
