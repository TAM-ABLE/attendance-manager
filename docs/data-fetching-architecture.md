# データ取得アーキテクチャ

## 概要

本アプリケーションは、Next.js App Router + Hono API の構成で、以下の2つのデータ取得パターンを組み合わせています。

1. **SSC（Server Component）での初期データ取得**
2. **SWR でのクライアントサイド更新**

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
          │ app.fetch()                   │ /api/*
          │ (直接呼び出し)                  │ (Cookie 自動送信)
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                     Hono API                            │
│              (app/api/[...route])                        │
│         auth middleware が Cookie 読み取り                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
               ┌─────────────────┐
               │    Supabase     │
               └─────────────────┘
```

## 1. 初回表示（SSC）

### 処理フロー

1. ユーザーがページにアクセス
2. Server Component（`page.tsx`）が `fetchWithAuth()` で `app.fetch()` を使い Hono API を直接呼び出し（ネットワークラウンドトリップなし）
3. 取得したデータを Client Component に `initialData` として渡す
4. SWR の `fallbackData` に設定され、ローディングなしで即座に表示

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `lib/auth/server.ts` | `fetchWithAuth<T>()` - SSC 用の認証付き fetch（`app.fetch()` で直接呼び出し） |
| `app/(auth)/*/page.tsx` | SSC でデータ取得、Client Component に渡す |

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

## 2. 操作後の更新（SWR）

### 処理フロー

1. ユーザーが操作（出勤・退勤など）
2. `api-client.ts` が `/api/*` に直接リクエスト（Cookie は自動送信）
3. Hono auth middleware が Cookie からトークンを読み取り認証
4. SWR の `mutate()` で最新データを再取得、画面更新

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `lib/api-client.ts` | Client 用 API 呼び出し（`/api/*` に直接リクエスト） |
| `server/middleware/auth.ts` | Cookie or Authorization ヘッダーからトークン読み取り |
| `hooks/use*.ts` | SWR でデータ管理、`mutate()` で再取得 |

### コード例

```typescript
// lib/api-client.ts
export async function apiClient<T>(endpoint: string, options = {}) {
  const res = await fetch(`/api${endpoint}`, options)
  // ...
}
```

## 認証フロー

### Cookie管理

- ログイン時: Hono `/api/auth/login` ルートが HttpOnly Cookie にトークン保存
- ログアウト時: Hono `/api/auth/logout` ルートが Cookie 削除

### トークン送信

| 実行場所 | 方法 |
|----------|------|
| SSC | `fetchWithAuth()` が `cookies()` からトークン取得 → `app.fetch()` で Authorization ヘッダーとして送信 |
| Client | ブラウザが Cookie を自動送信 → Hono auth middleware が読み取り |

## なぜこの設計か

### SSC を使う理由

- **UX向上**: 初期表示でローディングが出ない
- **パフォーマンス**: `app.fetch()` による直接呼び出し（ネットワークラウンドトリップなし）
- **SEO**: データが HTML に含まれる

### Hono 統合の利点

- **単一アプリ**: Next.js API Routes 上で Hono が動作、別サーバー不要
- **Cookie 直接読み取り**: proxy 不要、Hono middleware が Cookie を直接処理
- **OpenAPI**: `@hono/zod-openapi` による API ドキュメント自動生成

### SWR を使う理由

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
lib/
├── auth/
│   └── server.ts        # fetchWithAuth（SSC用、app.fetch()で直接呼び出し）
├── api-client.ts        # apiClient（Client用、/api/* に直接リクエスト）
└── swr-keys.ts          # SWRキャッシュキー定義
hooks/
└── useUserSelect.ts     # 汎用ユーザー選択hook（initialData対応）
app/(auth)/
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
