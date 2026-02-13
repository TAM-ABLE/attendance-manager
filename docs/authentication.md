# 認証アーキテクチャ

## 概要

本アプリケーションは **JWT + HttpOnly Cookie** 方式で認証を実装しています。

- **トークン発行・Cookie管理**: Hono API（`server/routes/auth/`）
- **トークン保存**: HttpOnly Cookie
- **SSC認証**: `app.fetch()` で直接 Hono を呼び出し（ネットワークラウンドトリップなし）
- **Client認証**: `/api/*` に直接リクエスト（Cookie は自動送信、Hono ミドルウェアが読み取り）

## 認証フロー図

### ログイン

```
┌──────────┐    ┌──────────────────────┐    ┌───────────────┐
│ ブラウザ  │    │ Hono API             │    │ GoTrue API    │
│          │    │ /api/auth/login       │    │ (Supabase Auth)│
└────┬─────┘    └──────────┬───────────┘    └──────┬────────┘
     │                     │                       │
     │ POST /api/auth/login│                       │
     │ {email, password}   │                       │
     │────────────────────>│                       │
     │                     │                       │
     │                     │ fetch (GoTrue REST API)│
     │                     │──────────────────────>│
     │                     │                       │
     │                     │  JWT発行               │
     │                     │<──────────────────────│
     │                     │                       │
     │ Set-Cookie:         │                       │
     │ accessToken=xxx     │                       │
     │ (HttpOnly)          │                       │
     │<────────────────────│                       │
     │                     │                       │
```

### 認証付きリクエスト（Client）

```
┌──────────┐    ┌───────────────────────────┐
│ ブラウザ  │    │ Hono API                  │
│          │    │ (app/api/[...route])       │
└────┬─────┘    └──────────┬────────────────┘
     │                     │
     │ /api/*              │
     │ Cookie: accessToken │
     │────────────────────>│
     │                     │
     │                     │ auth middleware が
     │                     │ Cookie から token 読み取り
     │                     │ jose で JWT をローカル検証
     │                     │
     │   レスポンス         │
     │<────────────────────│
     │                     │
```

### 認証付きリクエスト（SSC）

```
┌───────────────────┐    ┌──────────┐
│ Server Component  │    │ Hono API │
│ (fetchWithAuth)   │    │          │
└───────┬───────────┘    └────┬─────┘
        │                     │
        │ cookies() で         │
        │ トークン取得          │
        │                     │
        │ app.fetch() で      │
        │ 直接呼び出し          │
        │ Authorization:      │
        │ Bearer token        │
        │────────────────────>│
        │                     │
        │   レスポンス          │
        │<────────────────────│
        │                     │
```

## Route Groups によるアクセス制御

```
app/
├── (public)/              # 公開ページ（認証不要）
│   └── login/
│
├── (auth)/                # 認証必須ページ
│   ├── layout.tsx         # requireAuth() でチェック
│   ├── dashboard/
│   ├── attendance-history/
│   ├── edit-attendance/
│   ├── report-list/
│   │
│   └── (admin)/           # 管理者専用ページ
│       ├── layout.tsx     # requireAdmin() でチェック
│       └── admin/
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
| `server/routes/auth/login.ts` | ログイン処理、Cookie にトークン保存 |
| `server/routes/auth/logout.ts` | ログアウト処理、Cookie 削除 |
| `server/middleware/auth.ts` | JWT 認証ミドルウェア（jose でローカル検証、Cookie or Authorization ヘッダー） |
| `server/lib/auth-helpers.ts` | jose JWT 検証 + GoTrue REST API ヘルパー（login, user creation） |
| `app/api/[...route]/route.ts` | Hono アプリを Next.js API Routes にマウント |
| `lib/auth/server.ts` | SSC 用認証ユーティリティ（`app.fetch()` で直接呼び出し） |
| `lib/auth/with-retry.ts` | 401 エラー時のリダイレクト処理 |
| `lib/api-client.ts` | Client 用 API 呼び出し（`/api/*` 直接） |

## Cookie 設定

Hono の login ルートが直接 Cookie を設定:

```typescript
setCookie(c, "accessToken", accessToken, {
  httpOnly: true,                              // JSからアクセス不可
  secure: true,                                // HTTPSのみ
  sameSite: "Lax",                             // CSRF対策
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

現在のユーザーを取得（認証されていなければ `null`）。`app.fetch()` で直接 Hono を呼び出す。

```typescript
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value
  if (!accessToken) return null

  const req = new Request("http://localhost/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const res = await app.fetch(req, process.env)
  // ...
})
```

### requireAuth()

認証必須ページ用。未認証なら `/login` へリダイレクト。

### requireUser()

一般ユーザー専用ページ用。管理者なら `/admin` へリダイレクト。ダッシュボード等で使用。

### requireAdmin()

管理者専用ページ用。管理者でなければ `/dashboard` へリダイレクト。

### fetchWithAuth()

SSC用の認証付きfetch。`app.fetch()` でネットワークラウンドトリップなし。

```typescript
export async function fetchWithAuth<T>(endpoint: string): Promise<T | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value
  if (!accessToken) return null

  const req = new Request(`http://localhost/api${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const res = await app.fetch(req, process.env)
  // ...
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
| CSRF | sameSite: "Lax" |
| トークン漏洩 | Cookie経由のみ、レスポンスにトークン含めない |
| 権限チェック | layout.tsxで事前チェック |
| HTTPS | secure: true（本番環境） |
