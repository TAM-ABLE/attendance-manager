# 認証アーキテクチャ

## 概要

本アプリケーションは **JWT + HttpOnly Cookie** 方式で認証を実装しています。

- **トークン発行**: Hono API（バックエンド）
- **トークン保存**: Next.js Route Handler が HttpOnly Cookie に保存
- **トークン送信**: Cookie → Authorization ヘッダーに変換

## 認証フロー図

### ログイン

```
┌──────────┐    ┌─────────────────────┐    ┌──────────┐    ┌──────────┐
│ ブラウザ  │    │ Next.js Route Handler│    │ Hono API │    │ Supabase │
└────┬─────┘    └──────────┬──────────┘    └────┬─────┘    └────┬─────┘
     │                     │                    │               │
     │ POST /api/auth/login│                    │               │
     │ {email, password}   │                    │               │
     │────────────────────>│                    │               │
     │                     │                    │               │
     │                     │ POST /auth/login   │               │
     │                     │───────────────────>│               │
     │                     │                    │               │
     │                     │                    │ 認証リクエスト │
     │                     │                    │──────────────>│
     │                     │                    │               │
     │                     │                    │  JWT発行      │
     │                     │                    │<──────────────│
     │                     │                    │               │
     │                     │ { accessToken }    │               │
     │                     │<───────────────────│               │
     │                     │                    │               │
     │ Set-Cookie:         │                    │               │
     │ accessToken=xxx     │                    │               │
     │ (HttpOnly)          │                    │               │
     │<────────────────────│                    │               │
     │                     │                    │               │
```

### 認証付きリクエスト（Client）

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ ブラウザ  │    │ proxy.ts │    │ Hono API │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │ /api/proxy/*  │               │
     │ Cookie: token │               │
     │──────────────>│               │
     │               │               │
     │               │ Authorization │
     │               │ Bearer token  │
     │               │──────────────>│
     │               │               │
     │               │   レスポンス   │
     │               │<──────────────│
     │               │               │
     │   レスポンス   │               │
     │<──────────────│               │
     │               │               │
```

### 認証付きリクエスト（SSC）

```
┌───────────────┐    ┌──────────┐
│ Server Component │    │ Hono API │
│ (fetchWithAuth)  │    │          │
└───────┬───────┘    └────┬─────┘
        │                 │
        │ cookies() で    │
        │ トークン取得     │
        │                 │
        │ Authorization   │
        │ Bearer token    │
        │────────────────>│
        │                 │
        │   レスポンス     │
        │<────────────────│
        │                 │
```

## Route Groups によるアクセス制御

```
app/
├── (public)/              # 公開ページ（認証不要）
│   ├── login/
│   └── sign-up/
│
├── (auth)/                # 認証必須ページ
│   ├── layout.tsx         # requireAuth() でチェック
│   ├── dashboard/
│   ├── attendance-history/
│   │
│   └── (admin)/           # 管理者専用ページ
│       ├── layout.tsx     # requireAdmin() でチェック
│       ├── admin/
│       └── report-list/
```

### layout.tsx での認証チェック

```typescript
// app/(auth)/layout.tsx
import { requireAuth } from "@/lib/auth/server"

export default async function AuthLayout({ children }) {
  const user = await requireAuth()  // 未認証なら /login へリダイレクト
  return <>{children}</>
}
```

```typescript
// app/(auth)/(admin)/layout.tsx
import { requireAdmin } from "@/lib/auth/server"

export default async function AdminLayout({ children }) {
  await requireAdmin()  // 管理者でなければ /dashboard へリダイレクト
  return <>{children}</>
}
```

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| `app/api/auth/login/route.ts` | ログイン処理、Cookie保存 |
| `app/api/auth/logout/route.ts` | ログアウト処理、Cookie削除 |
| `app/api/auth/register/route.ts` | ユーザー登録、Cookie保存 |
| `lib/auth/server.ts` | SSC用認証ユーティリティ |
| `lib/auth/with-retry.ts` | 401エラー時のリダイレクト処理 |
| `lib/api-client.ts` | Client用API呼び出し（login, logout関数） |
| `proxy.ts` | Cookie → Authorization変換 |

## Cookie 設定

```typescript
// app/api/auth/login/route.ts
cookieStore.set("accessToken", accessToken, {
  httpOnly: true,                              // JSからアクセス不可
  secure: process.env.NODE_ENV === "production", // 本番はHTTPSのみ
  sameSite: "lax",                             // CSRF対策
  maxAge: 60 * 60 * 24 * 7,                    // 7日間有効
  path: "/",                                   // 全パスで有効
})
```

### なぜ HttpOnly Cookie？

| 方式 | XSS攻撃 | CSRF攻撃 |
|------|---------|----------|
| localStorage | 脆弱 | 安全 |
| HttpOnly Cookie | 安全 | sameSiteで対策 |

HttpOnly Cookie は JavaScript からアクセスできないため、XSS攻撃でトークンを盗まれるリスクがない。

## 認証ユーティリティ（lib/auth/server.ts）

### getUser()

現在のユーザーを取得（認証されていなければ `null`）

```typescript
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) return null

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return null
  return res.json().then(j => j.data)
})
```

### requireAuth()

認証必須ページ用。未認証なら `/login` へリダイレクト。

```typescript
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}
```

### requireAdmin()

管理者専用ページ用。管理者でなければ `/dashboard` へリダイレクト。

```typescript
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin") redirect("/dashboard")
  return user
}
```

### fetchWithAuth()

SSC用の認証付きfetch。

```typescript
export async function fetchWithAuth<T>(endpoint: string): Promise<T | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) return null

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return null
  return res.json().then(j => j.data)
}
```

## エラーハンドリング（lib/auth/with-retry.ts）

Client側で401エラーが発生した場合、ログインページへリダイレクト。

```typescript
export async function withRetry<T>(action: () => Promise<ApiResult<T>>) {
  const result = await action()

  if (!result.success && result.error.code === ErrorCodes.UNAUTHORIZED) {
    window.location.href = "/login"
  }

  return result
}
```

## ユーザー型

```typescript
// lib/auth/server.ts
export type AuthUser = {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}
```

## セキュリティ考慮事項

| 対策 | 実装 |
|------|------|
| XSS | HttpOnly Cookie（JSからアクセス不可） |
| CSRF | sameSite: "lax" |
| トークン漏洩 | Cookie経由のみ、レスポンスにトークン含めない |
| 権限チェック | layout.tsxで事前チェック |
| HTTPS | secure: true（本番環境） |
