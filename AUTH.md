# 認証システム

## 概要

HttpOnly Cookie ベースの認証を採用。セキュリティと整合性を重視したシンプルな設計。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (Next.js)              Backend (Hono)             │
│                                                             │
│  ┌─────────────┐                ┌─────────────────┐        │
│  │  Zustand    │                │  Supabase Auth  │        │
│  │  (メモリ)   │                │  (JWT発行)      │        │
│  │             │                │                 │        │
│  │  user: {    │   Cookie       │  HttpOnly       │        │
│  │    id,      │ ◄────────────► │  accessToken    │        │
│  │    name,    │   自動送信     │  (7日間有効)    │        │
│  │    email,   │                │                 │        │
│  │    role     │                └─────────────────┘        │
│  │  }          │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 認証フロー

### ログイン

```
1. ユーザーが email/password を入力
2. POST /auth/login
3. Backend: Supabase Auth で認証
4. Backend: Set-Cookie で accessToken を設定 (HttpOnly)
5. Frontend: レスポンスの user を Zustand に保存
```

### ページリロード

```
1. ページロード
2. providers.tsx が fetchMe() を実行
3. GET /auth/me (Cookie 自動送信)
4. Backend: Cookie の accessToken を検証
5. Backend: Supabase から最新の user 情報を取得
6. Frontend: Zustand に user を保存
```

### ログアウト

```
1. POST /auth/logout
2. Backend: Cookie を削除 (Max-Age=0)
3. Frontend: Zustand の user を null に
```

## ファイル構成

### Frontend

```
frontend/
├── stores/
│   └── auth.ts              # Zustand store (user, isLoading)
├── hooks/
│   └── useAuth.ts           # React hook (isAuthenticated, isAdmin)
├── lib/auth/
│   ├── api.ts               # API関数 (login, register, logout, fetchMe)
│   └── with-retry.ts        # 401エラーハンドリング
├── app/
│   └── providers.tsx        # 初回の fetchMe() 呼び出し
└── proxy.ts                 # ルート保護 (middleware)
```

### Backend

```
backend/src/routes/auth/
├── index.ts                 # ルーター
├── login.ts                 # POST /auth/login
├── register.ts              # POST /auth/register
├── logout.ts                # POST /auth/logout
└── me.ts                    # GET /auth/me
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
  httpOnly: true,      // JavaScript からアクセス不可
  secure: true,        // HTTPS のみ (本番)
  sameSite: "Lax",     // CSRF 対策
  maxAge: 60*60*24*7,  // 7日間
  path: "/",
}
```

## ルート保護

### proxy.ts (Middleware)

```typescript
// 認証が必要なルート
const protectedRoutes = ["/dashboard", "/admin", "/attendance-history", "/report-list"];

// Cookie がなければ /login にリダイレクト
if (isProtectedRoute && !accessToken) {
  return NextResponse.redirect("/login");
}
```

### with-retry.ts (API エラーハンドリング)

```typescript
// 401 エラー時に Zustand をクリア
if (result.error.code === "UNAUTHORIZED") {
  useAuthStore.getState().setUser(null);
}
```

## 使い方

### 認証チェックの責任分担

```
proxy.ts (middleware)
└─ /dashboard, /admin 等へのアクセス時に Cookie をチェック
└─ Cookie がなければ /login にリダイレクト
└─ ページコンポーネントに到達する前にブロック

つまり:
保護されたルートに到達 = 認証済み (proxy.ts を通過済み)
```

**保護されたページでは isLoading チェックは不要:**

| ページ/コンポーネント | isLoading チェック | 理由 |
|---------------------|-------------------|------|
| /dashboard | 不要 | proxy.ts が保護 |
| /admin | 不要 | proxy.ts が保護 |
| /attendance-history | 不要 | proxy.ts が保護 |
| /report-list | 不要 | proxy.ts が保護 |
| Header | 不要 | user が null なら非表示 |

### Header での使用例

```typescript
// proxy.ts が保護しているので、シンプルに書ける
function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated || !user) return null;

  return (
    <header>
      <span>{user.name}</span>
      {isAdmin && <AdminMenu />}
      <button onClick={logout}>ログアウト</button>
    </header>
  );
}
```

### ログイン処理

```typescript
const { login } = useAuth();

const handleSubmit = async () => {
  const result = await login(email, password);
  if (result.success) {
    router.push("/dashboard");
  } else {
    setError(result.error);
  }
};
```

## セキュリティ

- **XSS 対策**: HttpOnly Cookie でトークンを保護
- **CSRF 対策**: SameSite=Lax で同一オリジンのみ
- **トークン漏洩**: JavaScript からアクセス不可
- **整合性**: 毎回 API で最新情報を取得
