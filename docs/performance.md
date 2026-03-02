# パフォーマンス最適化

本ドキュメントでは、アプリケーション全体に適用されたパフォーマンス最適化の一覧と、その設計意図を説明します。

---

## 概要

最適化は以下の4カテゴリに分類されます。

| カテゴリ | 対象 | 主な施策 |
|---------|------|---------|
| バンドルサイズ | フロントエンド | framer-motion 削除、Swagger UI dev-only 化 |
| ネットワーク | API レスポンス | Cache-Control、Slack 通知の非同期化 |
| データベース | クエリ・接続 | インデックス追加、SQL集計、upsert、コネクションプール |
| レンダリング | React コンポーネント | React.memo、SWR グローバル設定 |

---

## 1. バンドルサイズ削減

### framer-motion の削除

`Loader` コンポーネントで使用していた `framer-motion`（約 30KB gzip）を削除し、CSS `animate-spin` に置き換えました。

| 変更前 | 変更後 |
|--------|--------|
| `framer-motion` の `motion.div` + `animate={{ rotate: 360 }}` | `className="animate-spin"` (Tailwind CSS) |
| dependencies に `framer-motion` | 依存なし |

**対象ファイル**: `components/Loader.tsx`

### Swagger UI の開発環境限定化

`@hono/swagger-ui` を `dependencies` → `devDependencies` に移動し、動的 import で本番バンドルから除外しました。

```typescript
// server/app.ts
if (process.env.NODE_ENV !== "production") {
  import("./lib/swagger").then(({ registerSwagger }) => registerSwagger(app))
}
```

- OpenAPI 仕様書・Swagger UI の登録ロジックは `server/lib/swagger.ts` に分離
- 本番ビルドでは `@hono/swagger-ui` が一切バンドルされない

---

## 2. ネットワーク最適化

### Cache-Control ヘッダー

読み取り頻度が高く、短期間で変化しにくい月次データエンドポイントにブラウザキャッシュを設定しました。

| エンドポイント | Cache-Control |
|---------------|---------------|
| `GET /api/attendance/month/{yearMonth}` | `private, max-age=60` |
| `GET /api/admin/users/{userId}/attendance/month/{yearMonth}` | `private, max-age=60` |
| `GET /api/daily-reports/user/{userId}/month/{yearMonth}` | `private, max-age=60` |

- `private`: ブラウザキャッシュのみ（CDN キャッシュ不可、認証データのため）
- `max-age=60`: 60秒間はネットワークリクエストなしでキャッシュから返す

**対象ファイル**: `server/routes/attendance/queries.ts`, `server/routes/admin/users.ts`, `server/routes/daily-reports.ts`

### Slack 通知の非同期化（fire-and-forget）

出勤・退勤時の Slack 通知を `await` せず、バックグラウンドで実行するように変更しました。

```
変更前: const slackResult = await sendClockInNotification(...)   // レスポンスを待つ
変更後: sendClockInNotification(...).then(...).catch(...)        // fire-and-forget
```

- 出勤・退勤 API のレスポンス時間から Slack API の待ち時間（数百ms〜数秒）を排除
- Slack 通知の失敗はコンソールログで記録し、ユーザー操作には影響しない

**対象ファイル**: `server/routes/attendance/clock.ts`

---

## 3. データベース最適化

### パフォーマンスインデックスの追加

頻繁にクエリされるカラムにインデックスを追加しました。

| インデックス | テーブル | カラム | 使用クエリ |
|-------------|---------|--------|-----------|
| `idx_work_sessions_attendance_id_clock_out` | `work_sessions` | `(attendance_id, clock_out)` | findActiveSession, findActiveSessionWithSlackTs, getSessionIdsByAttendanceId |
| `idx_breaks_session_id` | `breaks` | `(session_id)` | findActiveBreak, deleteBySessionIds |
| `idx_daily_reports_user_id_date` | `daily_reports` | `(user_id, date)` | findReportsByDateRange, findUnsubmittedReport |

**マイグレーション**: `supabase/migrations/00000000000003_add_performance_indexes.sql`

### 週間勤務時間の SQL 集計

週間合計の計算を JavaScript 側からデータベース側に移行しました。

```
変更前: 全レコードを取得 → JS で formatAttendanceRecord → reduce で合計
変更後: SQL で SUM(clockOut - clockIn - breaks) を直接計算
```

- ネットワーク転送量が大幅に削減（全セッションデータ → 単一の数値）
- DB側で集計することで計算効率も向上

**対象ファイル**: `server/lib/repositories/attendance.ts` (`calculateNetWorkMsByDateRange`), `server/routes/attendance/queries.ts`

### findOrCreateRecord の upsert 化

勤怠レコードの取得・作成を SELECT + INSERT の2クエリから、`INSERT ... ON CONFLICT DO UPDATE` の1クエリに統合しました。

```
変更前: SELECT で存在確認 → なければ INSERT（2クエリ、レースコンディションのリスク）
変更後: INSERT ON CONFLICT DO UPDATE（1クエリ、アトミック）
```

**対象ファイル**: `server/lib/repositories/attendance.ts` (`findOrCreateRecord`)

### コネクションプール設定

postgres.js クライアントにコネクションプール設定を明示的に追加しました。

```typescript
const client = postgres(databaseUrl, {
  prepare: false,
  max: 10,              // 最大接続数
  idle_timeout: 20,     // アイドル接続のタイムアウト（秒）
  connect_timeout: 10,  // 接続タイムアウト（秒）
})
```

**対象ファイル**: `server/db/index.ts`

---

## 4. レンダリング最適化

### React.memo によるコンポーネントメモ化

ダッシュボードの頻繁に再レンダリングされるコンポーネントを `React.memo` でラップし、props が変化しない場合の再レンダリングをスキップします。

| コンポーネント | ファイル |
|---------------|---------|
| `PunchButtons` | `app/(auth)/dashboard/components/PunchButtons.tsx` |
| `SummaryCard` | `app/(auth)/dashboard/components/SummaryCard.tsx` |
| `WeeklyAlert` | `app/(auth)/dashboard/components/WeeklyAlert.tsx` |

### SWR グローバル設定（SWRProvider）

`components/SWRProvider.tsx` で SWR の共通設定を一元管理し、`app/(auth)/layout.tsx` で認証済みページ全体をラップしています。

```typescript
<SWRConfig value={{
  revalidateOnFocus: false,   // タブ復帰時の自動再取得を無効化
  dedupingInterval: 5000,     // 5秒以内の重複リクエストを抑制
}}>
```

- 個別 hook での設定重複を排除
- `revalidateOnFocus: false` により不要なバックグラウンドリクエストを防止

---

## 5. その他

### メモリリーク修正（CSV エクスポート）

`exportMonthlyAttendanceCSV` で `URL.createObjectURL` で生成した Blob URL を、ダウンロード後に `URL.revokeObjectURL` で解放するようにしました。

**対象ファイル**: `lib/exportCsv.ts`
