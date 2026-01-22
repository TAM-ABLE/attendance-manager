# Backend - Attendance Manager API

勤怠管理システムのバックエンドAPI。Cloudflare Workers + Hono で構築されています。

## 技術スタック

- **Runtime**: Cloudflare Workers
- **Framework**: Hono + @hono/zod-openapi
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **Package Manager**: pnpm

## セットアップ

```bash
pnpm install
```

## 開発

```bash
pnpm dev
```

## デプロイ

```bash
pnpm deploy
```

## その他のコマンド

```bash
pnpm lint          # Biome lint 実行
pnpm lint:fix      # lint 自動修正
pnpm format        # コードフォーマット (Biome)
pnpm tsc --noEmit  # 型チェック
pnpm cf-typegen    # Cloudflareバインディング型の生成
```

## ディレクトリ構造

```
backend/
├── src/
│   ├── index.ts              # エントリーポイント（ルート定義、CORS、OpenAPI設定）
│   ├── middleware/
│   │   └── auth.ts           # 認証・認可ミドルウェア
│   ├── routes/
│   │   ├── auth/             # 認証関連（/auth/*）
│   │   │   ├── index.ts
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   └── me.ts
│   │   ├── attendance/       # 勤怠関連（/attendance/*）
│   │   │   ├── index.ts
│   │   │   ├── clock.ts      # 出勤・退勤
│   │   │   ├── breaks.ts     # 休憩開始・終了
│   │   │   └── queries.ts    # 勤怠データ取得
│   │   ├── admin/            # 管理者用（/admin/*）
│   │   │   ├── index.ts
│   │   │   └── users.ts      # ユーザー・勤怠管理
│   │   └── daily-reports.ts  # 日報関連（/daily-reports/*）
│   └── types/
│       ├── env.ts            # 環境変数の型定義
│       └── supabase.ts       # Supabase型定義
├── lib/
│   ├── openapi-hono.ts       # OpenAPI対応Honoインスタンス生成
│   ├── openapi-schemas.ts    # Zodスキーマ定義（リクエスト/レスポンス）
│   ├── supabase.ts           # Supabaseクライアント生成
│   ├── errors.ts             # エラーレスポンスヘルパー
│   ├── formatters.ts         # データ整形ユーティリティ
│   └── slack.ts              # Slack通知
└── wrangler.jsonc            # Cloudflare Workers設定
```

## API設計

### 認証レベル

| ルート | 認証 | 管理者権限 |
|--------|------|-----------|
| `/auth/*` | 不要 | 不要 |
| `/attendance/*` | 必要 | 不要 |
| `/admin/*` | 必要 | 必要 |
| `/daily-reports/*` | 必要 | 必要 |

### エンドポイント一覧

#### 認証 (`/auth`)
| Method | Path | 説明 |
|--------|------|------|
| POST | `/auth/login` | ログイン |
| POST | `/auth/register` | ユーザー登録 |
| POST | `/auth/logout` | ログアウト |
| GET | `/auth/me` | 現在のユーザー情報取得 |

#### 勤怠 (`/attendance`)
| Method | Path | 説明 |
|--------|------|------|
| POST | `/attendance/clock-in` | 出勤（日報の予定タスク登録、Slack通知） |
| POST | `/attendance/clock-out` | 退勤（日報の実績タスク登録、Slack通知） |
| POST | `/attendance/breaks/start` | 休憩開始 |
| POST | `/attendance/breaks/end` | 休憩終了 |
| GET | `/attendance/today` | 本日の勤怠取得 |
| GET | `/attendance/month/{yearMonth}` | 月別勤怠取得 |
| GET | `/attendance/week/total` | 週間勤務時間取得 |

#### 管理者 (`/admin`)
| Method | Path | 説明 |
|--------|------|------|
| GET | `/admin/users` | ユーザー一覧取得 |
| GET | `/admin/users/{userId}/attendance/month/{yearMonth}` | ユーザーの月別勤怠取得 |
| GET | `/admin/users/{userId}/attendance/{date}/sessions` | ユーザーの特定日セッション取得 |
| PUT | `/admin/users/{userId}/attendance/{date}/sessions` | ユーザーの特定日セッション更新 |

#### 日報 (`/daily-reports`)
| Method | Path | 説明 |
|--------|------|------|
| GET | `/daily-reports/users` | ユーザー一覧（日報用） |
| GET | `/daily-reports/user/{userId}/month/{yearMonth}` | ユーザーの月別日報一覧 |
| GET | `/daily-reports/{id}` | 日報詳細取得 |

### OpenAPI / Swagger UI

- **OpenAPI仕様書**: `/doc`
- **Swagger UI**: `/ui`

## 認証・認可

### 認証フロー

Hono は Pure API として Authorization ヘッダー（Bearer Token）のみを信頼する設計です。
Cookie の管理は Next.js 側で行います。

1. Supabase Auth でユーザー認証、accessToken を返却
2. Next.js Route Handler が HttpOnly Cookie にトークンを保存
3. クライアントは `/api/proxy/*` 経由でリクエスト（Cookie → Bearer 変換）
4. `authMiddleware` が Authorization ヘッダーからトークンを取得し、Supabase `getUser()` で検証
5. 検証成功時、`jwtPayload` に `sub`（ユーザーID）と `role` を格納

### ミドルウェア

```typescript
// authMiddleware: JWT検証、jwtPayload設定
app.use("/attendance/*", authMiddleware);

// adminMiddleware: role === 'admin' チェック
app.use("/admin/*", authMiddleware, adminMiddleware);
```

### JwtPayload型

```typescript
type JwtPayload = {
    sub: string;      // Supabase Auth の user id
    role: 'admin' | 'user';
};
```

## データベース設計

### テーブル構成

```
profiles              # ユーザープロフィール
├── id (uuid, PK)     # Supabase Auth user id
├── name
├── email
└── employee_number

attendance_records    # 日別勤怠レコード
├── id (uuid, PK)
├── user_id (FK → profiles)
└── date

work_sessions         # 勤務セッション（1日複数可）
├── id (uuid, PK)
├── attendance_id (FK → attendance_records)
├── clock_in
├── clock_out
└── slack_clock_in_ts # Slackメッセージts（スレッド返信用）

breaks                # 休憩（セッション内で複数可）
├── id (uuid, PK)
├── session_id (FK → work_sessions)
├── break_start
└── break_end

daily_reports         # 日報
├── id (uuid, PK)
├── user_id (FK → profiles)
├── date
├── summary           # 本日のまとめ
├── issues            # 課題・問題点
├── notes             # 備考
└── submitted_at

daily_report_tasks    # 日報タスク
├── id (uuid, PK)
├── daily_report_id (FK → daily_reports)
├── task_type         # 'planned' | 'actual'
├── task_name
├── hours
└── sort_order
```

### リレーション

```
profiles
  └── attendance_records (1:N)
        └── work_sessions (1:N)
              └── breaks (1:N)

profiles
  └── daily_reports (1:N)
        └── daily_report_tasks (1:N)
```

## Slack連携

出勤・退勤時にSlackへ通知を送信します。

### 機能
- **出勤通知**: ユーザー名と予定タスクを投稿
- **退勤通知**: 出勤メッセージのスレッドに実績タスク・日報を返信
- **カスタムアイコン**: 出勤・退勤で異なるアイコンを設定可能

### 環境変数
- `SLACK_BOT_TOKEN`: Slack Bot Token
- `SLACK_CHANNEL_ID`: 通知先チャンネルID
- `SLACK_ICON_CLOCK_IN`: 出勤通知アイコンURL（オプション）
- `SLACK_ICON_CLOCK_OUT`: 退勤通知アイコンURL（オプション）

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `SUPABASE_URL` | Yes | Supabase プロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Service Role Key |
| `JWT_SECRET` | Yes | JWT署名用シークレット |
| `SLACK_BOT_TOKEN` | Yes | Slack Bot Token |
| `SLACK_CHANNEL_ID` | Yes | Slack通知先チャンネルID |
| `SLACK_ICON_CLOCK_IN` | No | 出勤通知カスタムアイコンURL |
| `SLACK_ICON_CLOCK_OUT` | No | 退勤通知カスタムアイコンURL |
| `NODE_ENV` | No | 環境（development/production） |

環境変数は `wrangler.jsonc` および Cloudflare ダッシュボードで設定します。

## レスポンス形式

### 成功時
```json
{
  "success": true,
  "data": { ... }
}
```

### エラー時
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## Cloudflareバインディング

`CloudflareBindings`をHonoのジェネリクスとして渡します：

```typescript
const app = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();
```

型の生成・同期については[Wranglerドキュメント](https://developers.cloudflare.com/workers/wrangler/commands/#types)を参照してください。
