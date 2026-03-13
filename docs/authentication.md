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
        │ Cookie: accessToken │
        │────────────────────>│
        │                     │
        │   レスポンス          │
        │<────────────────────│
        │                     │
```

## 招待メールによるパスワード設定フロー

管理者がユーザーを登録すると、GoTrueの `/admin/generate_link` でリンクを生成し、Resend API 経由で招待メールを送信します。
新規ユーザーはメール内のリンクからパスワードを設定します。

### フロー図

```
┌──────────┐    ┌──────────────────────┐    ┌───────────────┐    ┌────────────┐
│ 管理者    │    │ Hono API             │    │ GoTrue API    │    │ Resend API │
│ ブラウザ  │    │ /api/admin/users     │    │ (Supabase)    │    │            │
└────┬─────┘    └──────────┬───────────┘    └──────┬────────┘    └─────┬──────┘
     │                     │                       │                   │
     │ POST /api/admin/users                       │                   │
     │ {lastName,firstName,│                       │                   │
     │  email}             │                       │                   │
     │────────────────────>│                       │                   │
     │                     │                       │                   │
     │                     │ /admin/generate_link   │                   │
     │                     │ type: "invite"         │                   │
     │                     │──────────────────────>│                   │
     │                     │                       │                   │
     │                     │  hashed_token 返却     │                   │
     │                     │<──────────────────────│                   │
     │                     │                       │                   │
     │                     │ リクエスト元originで     │                   │
     │                     │ リンク構築:             │                   │
     │                     │ /set-password?token_hash=xxx&type=invite  │
     │                     │                       │                   │
     │                     │ POST /emails                              │
     │                     │ {to, subject, html(setPasswordUrl)}       │
     │                     │──────────────────────────────────────────>│
     │                     │                                           │
     │                     │              送信完了                      │
     │                     │<──────────────────────────────────────────│
     │                     │                       │                   │
     │  作成成功            │                       │                   │
     │<────────────────────│                       │                   │
     │                     │                       │                   │
```

```
┌──────────┐    ┌──────────────────────┐    ┌───────────────┐
│ ユーザー  │    │ Hono API             │    │ GoTrue API    │
│ ブラウザ  │    │ /api/auth/*          │    │ (Supabase)    │
└────┬─────┘    └──────────┬───────────┘    └──────┬────────┘
     │                     │                       │
     │ メール内リンクをクリック                       │
     │ → /set-password?token_hash=xxx&type=invite  │
     │                     │                       │
     │ POST /api/auth/     │                       │
     │ verify-otp          │                       │
     │ {tokenHash, type}   │                       │
     │────────────────────>│                       │
     │                     │ POST /auth/v1/verify  │
     │                     │ {token_hash, type}    │
     │                     │──────────────────────>│
     │                     │                       │
     │                     │  access_token 返却     │
     │                     │<──────────────────────│
     │  {accessToken}      │                       │
     │<────────────────────│                       │
     │                     │                       │
     │ POST /api/auth/     │                       │
     │ set-password        │                       │
     │ {accessToken,       │                       │
     │  newPassword}       │                       │
     │────────────────────>│                       │
     │                     │ PUT /admin/users/{id}  │
     │                     │ {password,             │
     │                     │  password_changed:true} │
     │                     │──────────────────────>│
     │                     │                       │
     │ Set-Cookie:         │                       │
     │ accessToken=xxx     │                       │
     │<────────────────────│                       │
     │                     │                       │
     │ → /dashboard        │                       │
     │                     │                       │
```

### 未設定ユーザーのログイン制御

パスワード未設定（`password_changed: false`）のユーザーが `/login` からログインを試みた場合、
403エラーで「招待メールのリンクからパスワードを設定してください」と案内します。

## 招待メール再送・パスワードリセット

管理者画面からユーザーの状態に応じたリカバリー操作が可能です。

### 招待メール再送（招待中ユーザー向け）

招待リンクの期限切れ（24時間）やメール紛失時に、管理者が再送できます。

```
┌──────────┐    ┌──────────────────────────┐    ┌───────────┐    ┌────────────┐
│ 管理者    │    │ Hono API                 │    │ GoTrue    │    │ Resend API │
│ ブラウザ  │    │ /api/admin/users/        │    │           │    │            │
│          │    │  {userId}/resend-invite   │    │           │    │            │
└────┬─────┘    └────────────┬─────────────┘    └─────┬─────┘    └─────┬──────┘
     │                       │                        │                │
     │ POST resend-invite    │                        │                │
     │──────────────────────>│                        │                │
     │                       │                        │                │
     │                       │ /admin/generate_link   │                │
     │                       │ type: "invite"         │                │
     │                       │───────────────────────>│                │
     │                       │                        │                │
     │                       │  hashed_token           │                │
     │                       │<───────────────────────│                │
     │                       │                        │                │
     │                       │ リクエスト元originでリンク構築            │
     │                       │ Resend API で招待メール送信              │
     │                       │────────────────────────────────────────>│
     │                       │                                         │
     │  再送成功              │                        │                │
     │<──────────────────────│                        │                │
     │                       │                        │                │
```

→ 以降のフローは招待メールと同じ（ユーザーがリンクをクリック → パスワード設定）

### パスワードリセット（設定済みユーザー向け）

パスワードを忘れたユーザーに対し、管理者がリセットメールを送信できます。

```
┌──────────┐    ┌──────────────────────────┐    ┌───────────┐    ┌────────────┐
│ 管理者    │    │ Hono API                 │    │ GoTrue    │    │ Resend API │
│ ブラウザ  │    │ /api/admin/users/        │    │           │    │            │
│          │    │  {userId}/password-reset  │    │           │    │            │
└────┬─────┘    └────────────┬─────────────┘    └─────┬─────┘    └─────┬──────┘
     │                       │                        │                │
     │ POST password-reset   │                        │                │
     │──────────────────────>│                        │                │
     │                       │                        │                │
     │                       │ /admin/generate_link   │                │
     │                       │ type: "recovery"       │                │
     │                       │───────────────────────>│                │
     │                       │                        │                │
     │                       │  hashed_token           │                │
     │                       │<───────────────────────│                │
     │                       │                        │                │
     │                       │ リクエスト元originでリンク構築            │
     │                       │ Resend API でリセットメール送信          │
     │                       │────────────────────────────────────────>│
     │                       │                                         │
     │  送信成功              │                        │                │
     │<──────────────────────│                        │                │
     │                       │                        │                │
```

→ ユーザーがリンクをクリック → `/set-password?token_hash=xxx&type=recovery` → verify-otp で access_token 取得 → パスワード再設定 → 自動ログイン

### ユーザーステータス

管理者画面のユーザー一覧には、GoTrue の `user_metadata.password_changed` フラグに基づくステータスが表示されます。

| ステータス | 条件 | 利用可能なアクション |
|-----------|------|-------------------|
| 招待中 | `password_changed: false` | 招待メール再送 |
| 設定済み | `password_changed: true` | パスワードリセット |

### パスワード強度バリデーション（`hooks/usePasswordStrength.ts`）

- 8文字以上
- 英字を含む
- 数字を含む

### メール配信

- Resend API（`server/lib/resend.ts`）経由でメール送信
- GoTrue `/admin/generate_link` でリンク生成（メール送信なし）→ Resend API で送信
- 環境変数: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- 無料枠: 月3,000通（Resend）

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `server/routes/auth/set-password.ts` | パスワード設定API（トークンベース、invite/recovery 両対応） |
| `server/routes/admin/users.ts` | 招待メール再送・パスワードリセットAPI |
| `app/(public)/set-password/page.tsx` | パスワード設定ページ（invite/recovery で UI出し分け） |
| `server/lib/resend.ts` | Resend API メール送信 + HTMLテンプレート |
| `hooks/usePasswordStrength.ts` | パスワード強度バリデーション |
| `server/lib/auth-helpers.ts` | `generateLink()` - リンク生成、`goTrueAdminListUsers()` - ユーザーメタデータ取得 |

## Route Groups によるアクセス制御

```
app/
├── (public)/              # 公開ページ（認証不要）
│   ├── login/
│   └── set-password/      # 招待メールからのパスワード設定
│
├── (auth)/                # 認証必須ページ
│   ├── layout.tsx         # requireAuth() でチェック
│   ├── dashboard/
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
| `server/routes/auth/set-password.ts` | 招待トークンによるパスワード設定処理 |
| `server/middleware/auth.ts` | JWT 認証ミドルウェア（jose でローカル検証、Cookie から取得） |
| `server/lib/auth-helpers.ts` | jose JWT 検証 + GoTrue REST API ヘルパー（login, generate_link, password update, listUsers） |
| `server/lib/resend.ts` | Resend API メール送信 + HTMLテンプレート |
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
    headers: { Cookie: `accessToken=${accessToken}` },
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
    headers: { Cookie: `accessToken=${accessToken}` },
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
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
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
