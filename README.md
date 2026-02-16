# 勤怠管理・日報システム

## 概要

**勤怠管理（出勤・退勤）と日報提出を行う Web アプリケーション**です。
社員・アルバイトなどの勤務時間管理と日報提出を簡単に行えるように設計されています。

---

## 機能一覧

### 勤怠管理
- 出勤 / 退勤打刻
- 休憩開始 / 休憩終了
- 複数セッション（1日最大3セッション）対応
- 勤務時間の自動集計
- カレンダー形式での勤怠履歴表示
- 月次サマリー表示

### 日報
- 日報の作成・提出
- タスクリスト形式での作業内容記録
- 日報一覧の確認

### 管理者機能
- ユーザー登録（管理者のみ）
- ユーザー一覧表示
- 勤怠データの確認・編集
- ユーザーの月次勤怠データをCSV形式でエクスポート

### 通知
- Slack通知（出勤・退勤時）

---

## 使用技術

### フロントエンド
| 技術 | バージョン |
|------|-----------|
| Next.js | 16 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Radix UI | - |
| shadcn/ui | - |
| SWR | 2 |
| Framer Motion | 12 |
| date-fns | 4 |
| lucide-react | - |
| react-day-picker | 9 |

### バックエンド (Next.js 統合)
| 技術 | 用途 |
|------|------|
| Hono | Web フレームワーク (Next.js API Routes 上で動作) |
| Hono Zod OpenAPI | API スキーマ定義 |
| Drizzle ORM | データベースアクセス (PostgreSQL) |
| jose | JWT 検証 (ローカル検証) |
| Supabase | PostgreSQL ホスティング + GoTrue 認証 |
| Zod | バリデーション |

### インフラ・ツール
| 技術 | 用途 |
|------|------|
| Vercel | ホスティング |
| pnpm | パッケージマネージャー |
| Biome | リンター・フォーマッター |
| ESLint | Next.js 固有ルール |
| GitHub Actions | CI/CD |

---

## ディレクトリ構成

```
attendance-manager/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # ルートレイアウト
│   ├── page.tsx               # トップページ（リダイレクト）
│   ├── api/[...route]/        # Hono API catch-all route
│   ├── (public)/              # 公開ページ
│   │   └── login/             # /login
│   └── (auth)/                # 認証必須ページ
│       ├── layout.tsx         # requireAuth()
│       ├── dashboard/         # /dashboard
│       ├── attendance-history/ # /attendance-history
│       ├── edit-attendance/   # /edit-attendance
│       ├── report-list/       # /report-list
│       └── (admin)/           # 管理者専用
│           ├── layout.tsx     # requireAdmin()
│           └── admin/         # /admin
├── components/                # React コンポーネント
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── Header/                # ヘッダー
│   └── ...
├── hooks/                     # カスタムフック
├── lib/                       # ユーティリティ
│   ├── api-client.ts          # API クライアント
│   ├── api-services/          # API サービス層（admin, attendance, daily-reports）
│   ├── auth/                  # 認証ユーティリティ
│   ├── schemas.ts             # Zod スキーマ定義
│   ├── time.ts                # 時間フォーマット
│   ├── calculation.ts         # 勤務時間計算
│   ├── constants.ts           # 定数
│   ├── exportCsv.ts           # CSV エクスポート
│   └── ...
├── types/                     # TypeScript 型定義
│   ├── Attendance.ts          # 勤怠関連型
│   ├── DailyReport.ts         # 日報関連型
│   └── ApiResponse.ts         # API レスポンス型
├── server/                    # Hono API
│   ├── app.ts                 # エントリーポイント
│   ├── db/                    # Drizzle ORM スキーマ・クライアント
│   ├── middleware/auth.ts     # JWT 認証ミドルウェア (jose)
│   ├── routes/                # API ルート
│   ├── lib/                   # サーバーユーティリティ
│   └── types/                 # サーバー型定義
├── supabase/                  # Supabase 設定
│   ├── config.toml            # Supabase 設定
│   ├── migrations/            # DB マイグレーション
│   └── seed.sql               # シードデータ
├── public/                    # 静的アセット
├── docs/                      # ドキュメント
├── .github/                   # CI ワークフロー
├── package.json
├── tsconfig.json
├── biome.json
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── components.json
├── lefthook.yml
├── CLAUDE.md
└── README.md
```

---

## ドキュメント

詳細なドキュメントは `docs/` にあります：

| ドキュメント | 内容 |
|-------------|------|
| [development-guide.md](docs/development-guide.md) | 開発環境ガイド（Supabase CLI、起動方法） |
| [data-fetching-architecture.md](docs/data-fetching-architecture.md) | データ取得設計（SSC + SWR） |
| [authentication.md](docs/authentication.md) | 認証設計（JWT + HttpOnly Cookie） |

---

## 認証アーキテクチャ

- **Cookie 管理**: Hono login ルートが HttpOnly Cookie を設定
- **Server Component**: `fetchWithAuth()` → `app.fetch()` で直接 Hono API を呼び出し
- **Client Component**: `/api/*` 経由（Cookie は自動送信）
- **Route Groups**: URL に影響を与えずにアクセス制御を適用

### Route Groups

| Route Group | 認証 | 含まれるページ |
|-------------|------|---------------|
| `(public)` | 不要 | /login |
| `(auth)` | 必須 | /dashboard, /attendance-history, /edit-attendance, /report-list |
| `(auth)/(admin)` | 管理者のみ | /admin |

---

## データ取得アーキテクチャ

SSC（Server Component）での初期データ取得 + SWR でのクライアントサイド更新：

- **初回表示**: SSC で `fetchWithAuth()` → `initialData` として Client Component に渡す → ローディングなし
- **操作後**: SWR `mutate()` で `/api/*` 経由で再取得 → 画面更新

---

## 開発環境のセットアップ

### 前提条件
- Node.js 20+
- pnpm

### インストール

```bash
git clone https://github.com/TAM-ABLE/attendance-manager.git
cd attendance-manager
pnpm install
```

### 環境変数 (`.env.local`)
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
SLACK_BOT_TOKEN=your_slack_bot_token (optional)
SLACK_CHANNEL_ID=your_slack_channel_id (optional)
```

---

## 開発コマンド

```bash
pnpm dev              # 開発サーバー起動 (localhost:3000)
pnpm build            # プロダクションビルド
pnpm lint             # Biome + ESLint (Next.js ルール) 実行
pnpm lint:fix         # lint 自動修正
pnpm format           # コードフォーマット
pnpm tsc --noEmit     # 型チェック
```

---

## API エンドポイント

### 認証
| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/auth/me` | 現在のユーザー情報取得 |

### 勤怠
| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/attendance/clock-in` | 出勤打刻 |
| POST | `/api/attendance/clock-out` | 退勤打刻 |
| POST | `/api/attendance/break-start` | 休憩開始 |
| POST | `/api/attendance/break-end` | 休憩終了 |
| GET | `/api/attendance/today` | 本日の勤怠取得 |
| GET | `/api/attendance/month/{yearMonth}` | 月別勤怠取得 |
| GET | `/api/attendance/week/total` | 週間勤務時間取得 |
| GET | `/api/attendance/{date}/sessions` | 特定日のセッション取得 |
| PUT | `/api/attendance/{date}/sessions` | 特定日のセッション更新 |

### 管理者
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/admin/users` | ユーザー一覧取得 |
| POST | `/api/admin/users` | ユーザー作成 |
| GET | `/api/admin/users/{userId}/attendance/month/{yearMonth}` | ユーザーの月別勤怠取得 |
| GET | `/api/admin/users/{userId}/attendance/{date}/sessions` | ユーザーの特定日セッション取得 |
| PUT | `/api/admin/users/{userId}/attendance/{date}/sessions` | ユーザーの特定日セッション更新 |

### 日報
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/daily-reports/users` | ユーザー一覧取得（日報用） |
| GET | `/api/daily-reports/user/{userId}/month/{yearMonth}` | ユーザーの月別日報一覧取得 |
| GET | `/api/daily-reports/{id}` | 日報詳細取得 |

---

## CI/CD

GitHub Actions による自動チェック（main/develop ブランチへの push/PR 時）:
- **CI**: Biome lint + ESLint (Next.js ルール) + 型チェック + ビルド
- **CodeQL**: セキュリティ分析（main への push/PR + 週次スケジュール）
- **Migration Check**: Drizzle スキーマと SQL マイグレーションの整合性を検証（関連ファイル変更時のみ）
- **Bundle Size**: PR 時にバンドルサイズの変化をレポート
- **Dependabot Lockfile Sync**: Dependabot PR のロックファイルを自動更新
- **Auto Add to Project**: 新規 Issue を GitHub Project に自動追加

---

## ライセンス

Private
