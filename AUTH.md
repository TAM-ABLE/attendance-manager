# 認証システム

## 概要

Cookie の責務を Next.js に集約し、Hono は Authorization ヘッダー（Bearer Token）のみを信頼する設計。
将来的にモバイルや他クライアントから Hono を直接利用可能な Pure API として構成。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Frontend (Next.js)                      Backend (Hono)             │
│                                                                     │
│  ┌─────────────────┐                    ┌─────────────────┐        │
│  │ Server Component│  Authorization     │  Supabase Auth  │        │
│  │                 │  Bearer Token      │  (JWT検証)      │        │
│  │  getUser()  ────┼───────────────────►│                 │        │
│  │  Cookie読み取り  │                    │  Pure API       │        │
│  │  → Bearer変換   │                    │  Cookie不使用   │        │
│  └─────────────────┘                    └─────────────────┘        │
│         │                                       ▲                  │
│         ▼ props                                 │ Authorization    │
│  ┌─────────────────┐    ┌─────────────────┐    │ Bearer Token     │
│  │ Client Component│───►│ proxy.ts        │────┘                  │
│  │  apiClient()    │    │ (リライト)       │                       │
│  │  /api/proxy経由 │    │ Cookie→Bearer   │                       │
│  └─────────────────┘    └─────────────────┘                       │
│                                                                     │
│  Cookie管理 (HttpOnly)                                             │
│  ┌─────────────────┐                                               │
│  │ Route Handler   │                                               │
│  │ /api/auth/*     │ ← login/register: Cookieセット               │
│  │                 │ ← logout: Cookie削除                         │
│  └─────────────────┘                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 設計方針

| 責務 | Next.js | Hono |
|------|---------|------|
| Cookie の読み書き | ○ | × |
| Authorization ヘッダー送信 | ○ | - |
| Authorization ヘッダー検証 | - | ○ |
| JWT 検証 | - | ○ |
| UI / SSR | ○ | - |
| ビジネスロジック / DB | - | ○ |

## 認証フロー

### ログイン

```
1. ユーザーが email/password を入力
2. Client Component から POST /api/auth/login (Next.js Route Handler)
3. Route Handler: Hono /auth/login にリクエスト転送
4. Hono: Supabase Auth で認証、accessToken を返却
5. Route Handler: accessToken を HttpOnly Cookie に保存
6. Frontend: router.push("/dashboard")
7. Server Component: getUser() で認証状態を取得
```

### API リクエスト（認証済み）

```
1. Client Component から /api/proxy/attendance/today
2. Route Handler: Cookie から accessToken を取得
3. Route Handler: Authorization: Bearer {token} ヘッダーを付与
4. Route Handler: Hono /attendance/today にリクエスト転送
5. Hono: Authorization ヘッダーを検証
6. Hono: レスポンス返却
```

### ページアクセス

```
1. リクエスト受信
2. layout.tsx: getUser() でユーザー取得 (Header用)
   └─ Cookie → Authorization ヘッダー変換 → Hono /auth/me
3. (auth)/layout.tsx: requireAuth() で認証チェック
   └─ 未認証なら /login へリダイレクト
4. (admin)/layout.tsx: requireAdmin() で権限チェック
   └─ 管理者でなければ /dashboard へリダイレクト
5. page.tsx: レンダリング
```

### ログアウト

```
1. POST /api/auth/logout (Next.js Route Handler)
2. Route Handler: Cookie を削除
3. Frontend: router.refresh() + router.push("/login")
```

## ファイル構成

### Frontend

```
frontend/
├── proxy.ts                    # Cookie→Bearer変換 + Honoへリライト
├── lib/
│   ├── api-client.ts           # APIクライアント (/api/proxy 経由)
│   └── auth/
│       ├── server.ts           # Server用 (Cookie→Bearer変換)
│       └── with-retry.ts       # 401エラー時リダイレクト
├── app/
│   ├── api/auth/
│   │   ├── login/route.ts      # ログイン + Cookie設定
│   │   ├── register/route.ts   # 登録 + Cookie設定
│   │   └── logout/route.ts     # Cookie削除
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
└── src/
    ├── middleware/
    │   └── auth.ts             # Authorization ヘッダー認証ミドルウェア
    └── routes/auth/
        ├── index.ts            # ルーター
        ├── login.ts            # POST /auth/login (トークン返却のみ)
        ├── register.ts         # POST /auth/register (トークン返却のみ)
        ├── logout.ts           # POST /auth/logout (何もしない)
        └── me.ts               # GET /auth/me (Authorization ヘッダー検証)
```

## API エンドポイント

### Next.js

| 種別 | Path | 説明 |
|------|------|------|
| Route Handler | /api/auth/login | ログイン、Cookie 設定 |
| Route Handler | /api/auth/register | ユーザー登録、Cookie 設定 |
| Route Handler | /api/auth/logout | Cookie 削除 |
| proxy.ts | /api/proxy/* | Cookie→Bearer変換 + Honoへリライト |

### Hono API (Backend)

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | /auth/login | 不要 | ログイン、トークン返却 |
| POST | /auth/register | 不要 | ユーザー登録、トークン返却 |
| POST | /auth/logout | 不要 | 何もしない（クライアント側でCookie削除） |
| GET | /auth/me | Bearer | 現在のユーザー情報取得 |
| * | /attendance/* | Bearer | 勤怠操作 |
| * | /admin/* | Bearer + Admin | 管理者操作 |
| * | /daily-reports/* | Bearer + Admin | 日報閲覧 |

## Cookie 設定

```typescript
// frontend/app/api/auth/login/route.ts
cookieStore.set("accessToken", accessToken, {
  httpOnly: true,           // JavaScript からアクセス不可
  secure: process.env.NODE_ENV === "production",  // HTTPS のみ (本番)
  sameSite: "lax",          // CSRF 対策
  maxAge: 60*60*24*7,       // 7日間
  path: "/",
});
```

## Authorization ヘッダー

```typescript
// backend/src/middleware/auth.ts
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// ミドルウェアで検証
const authHeader = c.req.header('Authorization');
const token = extractBearerToken(authHeader);
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
// Cookie から取得したトークンを Authorization ヘッダーに変換
export const getUser = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;

  // Authorization ヘッダーで Hono に送信
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  // ...
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
// /api/proxy 経由で自動的に Authorization ヘッダーが付与される
import { apiClient } from "@/lib/api-client";

function getToday() {
  return apiClient<AttendanceRecord | null>("/attendance/today");
}
```

### モバイルや他クライアントから直接 Hono を使用

```typescript
// Cookie を使わず、直接 Authorization ヘッダーを送信
const res = await fetch("https://api.example.com/attendance/today", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## セキュリティ

- **XSS 対策**: HttpOnly Cookie でトークンを保護
- **CSRF 対策**: SameSite=Lax で同一オリジンのみ
- **トークン漏洩**: JavaScript からアクセス不可
- **Server First**: 認証チェックはサーバーで実行
- **Pure API**: Hono は Web に依存しない設計

## 設計のポイント

| 項目 | 説明 |
|------|------|
| Cookie 責務の集約 | Next.js のみが Cookie を管理 |
| Pure API | Hono は Authorization ヘッダーのみ信頼 |
| マルチクライアント対応 | モバイル等から直接 Hono を利用可能 |
| Server Component 中心 | 認証はサーバーで、クライアントJSを最小化 |
| Route Groups | 認証ロジックを layout に集約 |
| React cache() | 同一リクエスト内の重複API呼び出しを防止 |
| proxy.ts リライト | Cookie→Bearer 変換を透過的に実行 |
