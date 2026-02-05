# データ取得アーキテクチャ

## 概要

本アプリケーションは、Next.js App Router + Hono API の構成で、以下の2つのデータ取得パターンを組み合わせています。

1. **SSC（Server Component）での初期データ取得**
2. **SWR + proxy.ts でのクライアントサイド更新**

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                      ブラウザ                            │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    [初回表示]                      [操作後の更新]
          │                               │
          ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  SSC (page.tsx) │             │   SWR mutate()  │
│  fetchWithAuth  │             │   api-client.ts │
└─────────────────┘             └─────────────────┘
          │                               │
          │ 直接                          │ /api/proxy/*
          ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│                 │             │    proxy.ts     │
│                 │             │ Cookie → Header │
│    Hono API     │◀────────────└─────────────────┘
│                 │
└─────────────────┘
          │
          ▼
┌─────────────────┐
│    Supabase     │
└─────────────────┘
```

## 1. 初回表示（SSC）

### 処理フロー

1. ユーザーがページにアクセス
2. Server Component（`page.tsx`）が `fetchWithAuth()` でHono APIを直接呼び出し
3. 取得したデータをClient Componentに `initialData` として渡す
4. SWRの `fallbackData` に設定され、ローディングなしで即座に表示

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `lib/auth/server.ts` | `fetchWithAuth<T>()` - SSC用の認証付きfetch |
| `app/(auth)/*/page.tsx` | SSCでデータ取得、Client Componentに渡す |

### コード例

```typescript
// page.tsx (Server Component)
import { fetchWithAuth } from "@/lib/auth/server"

export default async function DashboardPage() {
  const attendance = await fetchWithAuth<AttendanceRecord>("/attendance/today")
  return <DashboardClient initialData={{ attendance }} />
}
```

```typescript
// hooks/useDashboardAttendance.ts (Client Component)
useSWR(key, fetcher, {
  fallbackData: initialData?.attendance,      // SSCのデータを初期値に
  revalidateOnMount: !initialData,            // 初期データがあればfetchスキップ
})
```

## 2. 操作後の更新（SWR + proxy.ts）

### 処理フロー

1. ユーザーが操作（出勤・退勤など）
2. `api-client.ts` が `/api/proxy/*` にリクエスト
3. `proxy.ts` がCookieからトークンを取得し、Authorizationヘッダーに変換
4. Hono APIにリライト
5. SWRの `mutate()` で最新データを再取得、画面更新

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `lib/api-client.ts` | Client用API呼び出し（`/api/proxy/*` 経由） |
| `proxy.ts` | Cookie → Authorizationヘッダー変換、Honoへリライト |
| `hooks/use*.ts` | SWRでデータ管理、`mutate()` で再取得 |

### コード例

```typescript
// lib/api-client.ts
export async function apiClient<T>(endpoint: string, options = {}) {
  const res = await fetch(`/api/proxy${endpoint}`, options)
  // ...
}
```

```typescript
// proxy.ts (Next.js 16)
export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value
  const targetPath = request.nextUrl.pathname.replace("/api/proxy", "")
  const url = new URL(targetPath, API_URL)

  const headers = new Headers(request.headers)
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  matcher: "/api/proxy/:path*",
}
```

## 認証フロー

### Cookie管理

- ログイン時: `/api/auth/login` Route HandlerがHttpOnly Cookieにトークン保存
- ログアウト時: `/api/auth/logout` Route HandlerがCookie削除

### トークン変換

| 実行場所 | 変換方法 |
|----------|----------|
| SSC | `fetchWithAuth()` が `cookies()` からトークン取得 |
| Client | `proxy.ts` が `request.cookies` からトークン取得 |

どちらも **Cookie → Authorization ヘッダー** に変換してHono APIに送信。

## なぜこの設計か

### SSCを使う理由

- **UX向上**: 初期表示でローディングが出ない
- **パフォーマンス**: サーバー間通信（ラウンドトリップ削減）
- **SEO**: データがHTMLに含まれる

### proxy.tsを使う理由

- **CORS回避**: ブラウザから直接Honoを叩くとCORSエラー
- **セキュリティ**: HttpOnly CookieをブラウザのJSから読めない
- **Next.js 16対応**: middleware.tsは非推奨

### SWRを使う理由

- **キャッシュ管理**: 自動的にキャッシュ・再検証
- **リアルタイム性**: `mutate()` で即時更新
- **エラーハンドリング**: 自動リトライ

## 対象ページ

| ページ | SSC取得データ |
|--------|---------------|
| `/dashboard` | 今日の勤怠、週合計 |
| `/attendance-history` | 今月の勤怠一覧 |
| `/admin` | ユーザー一覧 |
| `/report-list` | ユーザー一覧 |

## 関連ファイル一覧

```
frontend/
├── lib/
│   ├── auth/
│   │   └── server.ts        # fetchWithAuth（SSC用）
│   ├── api-client.ts        # apiClient（Client用）
│   └── swr-keys.ts          # SWRキャッシュキー定義
├── proxy.ts                 # Cookie→Header変換、Honoへリライト
├── hooks/
│   └── useUserSelect.ts     # 汎用ユーザー選択hook（initialData対応）
└── app/(auth)/
    ├── dashboard/
    │   ├── page.tsx                    # SSCでデータ取得
    │   ├── components/
    │   │   └── DashboardClient.tsx     # initialData受け取り
    │   └── hooks/
    │       └── useDashboardAttendance.ts  # fallbackData対応
    ├── attendance-history/
    │   ├── page.tsx
    │   ├── components/
    │   │   └── AttendanceHistoryClient.tsx
    │   └── hooks/
    │       └── useAttendanceHistory.ts
    └── (admin)/
        ├── admin/
        │   ├── page.tsx
        │   ├── components/
        │   │   └── MonthlyAttendanceView.tsx
        │   └── hooks/
        │       └── useUsers.ts
        └── report-list/
            ├── page.tsx
            ├── components/
            │   └── ReportListView.tsx
            └── hooks/
                └── useReportUsers.ts
```
