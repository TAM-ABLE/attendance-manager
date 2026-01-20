# 認証システム

## 概要

HttpOnly Cookie ベースの認証 + Next.js App Router の Server Component を活用したシンプルな設計。
クライアントからHono APIへ直接リクエストし、Cookieは `credentials: "include"` で自動送信される。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (Next.js)              Backend (Hono)             │
│                                                             │
│  ┌─────────────────┐            ┌─────────────────┐        │
│  │ Server Component│            │  Supabase Auth  │        │
│  │                 │   Cookie   │  (JWT発行)      │        │
│  │  getUser()  ────┼───────────►│  HttpOnly       │        │
│  │  cache()で      │   自動送信  │  accessToken    │        │
│  │  リクエスト内    │            │  (7日間有効)    │        │
│  │  1回だけ実行    │            │                 │        │
│  └─────────────────┘            └─────────────────┘        │
│         │                              ▲                   │
│         ▼ props                        │ credentials:      │
│  ┌─────────────────┐                   │ "include"         │
│  │ Client Component├───────────────────┘                   │
│  │  apiClient()    │  Cookie自動送信                       │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 認証フロー

### ログイン

```
1. ユーザーが email/password を入力
2. Client Component から POST /auth/login (credentials: "include")
3. Backend: Supabase Auth で認証
4. Backend: Set-Cookie で accessToken を設定 (HttpOnly)
5. Frontend: router.push("/dashboard")
6. Server Component: getUser() で認証状態を取得
```

### ページアクセス

```
1. リクエスト受信
2. layout.tsx: getUser() でユーザー取得 (Header用)
3. (auth)/layout.tsx: requireAuth() で認証チェック
   └─ 未認証なら /login へリダイレクト
4. (admin)/layout.tsx: requireAdmin() で権限チェック
   └─ 管理者でなければ /dashboard へリダイレクト
5. page.tsx: レンダリング
```

### ログアウト

```
1. POST /auth/logout (Client Component から、credentials: "include")
2. Backend: Cookie を削除 (Max-Age=0)
3. Frontend: router.refresh() + router.push("/login")
```

## ファイル構成

### Frontend

```
frontend/
├── lib/
│   ├── api-client.ts           # APIクライアント (login, register, logout, apiClient)
│   └── auth/
│       ├── server.ts           # Server用 (getUser, requireAuth, requireAdmin)
│       └── with-retry.ts       # 401エラー時リダイレクト
├── app/
│   ├── layout.tsx              # getUser() → Header に props
│   ├── (auth)/
│   │   ├── layout.tsx          # requireAuth() - 認証必須
│   │   ├── dashboard/
│   │   ├── attendance-history/
│   │   └── (admin)/
│   │       ├── layout.tsx      # requireAdmin() - 管理者専用
│   │       ├── admin/
│   │       └── report-list/
│   └── (public)/
│       ├── login/
│       └── sign-up/
└── components/Header/
    ├── index.tsx               # Server Component
    ├── NavLinks.tsx            # Client (usePathname)
    ├── LogoutButton.tsx        # Client (logout処理)
    └── MobileMenu.tsx          # Client (メニュー開閉)
```

### Backend

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.ts             # Cookie認証ミドルウェア
│   └── routes/auth/
│       ├── index.ts            # ルーター
│       ├── login.ts            # POST /auth/login
│       ├── register.ts         # POST /auth/register
│       ├── logout.ts           # POST /auth/logout
│       └── me.ts               # GET /auth/me
└── lib/
    └── cookie.ts               # Cookie設定ヘルパー
```

## API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| POST | /auth/login | ログイン、Cookie 設定 |
| POST | /auth/register | ユーザー登録、Cookie 設定 |
| POST | /auth/logout | ログアウト、Cookie 削除 |
| GET | /auth/me | 現在のユーザー情報取得 |

## Cookie 設定

```typescript
// backend/lib/cookie.ts
{
  httpOnly: true,           // JavaScript からアクセス不可
  secure: true,             // HTTPS のみ (本番)
  sameSite: "Lax",          // CSRF 対策
  maxAge: 60*60*24*7,       // 7日間
  path: "/",
  domain: ".example.com",   // サブドメイン間共有 (COOKIE_DOMAIN環境変数)
}
```

### サブドメイン対応

`app.example.com` と `api.example.com` 間でCookieを共有するには：

```bash
# wrangler.jsonc または環境変数
COOKIE_DOMAIN=.example.com
```

## ルート保護

### Route Groups による保護

```
app/
├── (auth)/              # 認証必須グループ
│   └── layout.tsx       # requireAuth()
│       └── (admin)/     # 管理者専用グループ
│           └── layout.tsx  # requireAdmin()
└── (public)/            # 認証不要グループ
```

### lib/auth/server.ts

```typescript
// React cache() で同一リクエスト内は1回だけAPI呼び出し
export const getUser = cache(async () => {
  const token = cookies().get("accessToken");
  if (!token) return null;
  // GET /auth/me (Cookieヘッダーを送信)
  return fetchUser(token);
});

// 認証必須
export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// 管理者専用
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
```

### with-retry.ts (API エラーハンドリング)

```typescript
// Client Component から apiClient 呼び出し時
// 401 エラーでログインページへリダイレクト
if (result.error.code === "UNAUTHORIZED") {
  window.location.href = "/login";
}
```

## 使い方

### ページでの認証

```typescript
// app/(auth)/dashboard/page.tsx
// 認証チェックは (auth)/layout.tsx で済んでいる
export default function DashboardPage() {
  return <DashboardClient />;
}

// ユーザー情報が必要な場合
export default async function DashboardPage() {
  const user = (await getUser())!;  // layout で認証済みなので必ず存在
  return <DashboardClient user={user} />;
}
```

### Header (Server Component + 部分的 Client Component)

```typescript
// components/Header/index.tsx (Server Component)
export function Header({ user }: { user: AuthUser | null }) {
  if (!user) return null;

  return (
    <header>
      {/* Server でレンダリング */}
      <Logo />
      <UserInfo name={user.name} />

      {/* Client Component は必要な部分だけ */}
      <NavLinks isAdmin={user.role === "admin"} />
      <LogoutButton />
    </header>
  );
}
```

### ログイン処理 (Client Component)

```typescript
// app/(public)/login/page.tsx
import { login } from "@/lib/api-client";

const handleSubmit = async () => {
  const result = await login(email, password);
  if (result.success) {
    router.push("/dashboard");
  } else {
    setError(result.error);
  }
};
```

### API呼び出し (Client Component)

```typescript
// 各hooks内で直接apiClientを使用
import { apiClient } from "@/lib/api-client";

function getToday() {
  return apiClient<AttendanceRecord | null>("/attendance/today");
}
```

## セキュリティ

- **XSS 対策**: HttpOnly Cookie でトークンを保護
- **CSRF 対策**: SameSite=Lax で同一オリジンのみ
- **トークン漏洩**: JavaScript からアクセス不可
- **Server First**: 認証チェックはサーバーで実行

## 設計のポイント

| 項目 | 説明 |
|------|------|
| Server Component 中心 | 認証はサーバーで、クライアントJSを最小化 |
| Route Groups | 認証ロジックを layout に集約 |
| React cache() | 同一リクエスト内の重複API呼び出しを防止 |
| 状態管理なし | zustand等不要、props で渡すだけ |
| 直接API呼び出し | Server Actions層を廃止、1ホップ削減 |
| Cookie自動送信 | credentials: "include" でシンプルに |
