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
- ユーザー一覧表示
- 勤怠データの確認・編集
- ユーザーの月次勤怠データをCSV形式でエクスポート

### 通知
- Slack通知（出勤・退勤時）

---

## 使用技術

### Frontend
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

### Backend
| 技術 | 用途 |
|------|------|
| Cloudflare Workers | サーバーレス実行環境 |
| Hono | Web フレームワーク |
| Hono Zod OpenAPI | API スキーマ定義 |
| Supabase | データベース (PostgreSQL) |
| Zod | バリデーション |
| bcryptjs | パスワードハッシュ |

### インフラ・ツール
| 技術 | 用途 |
|------|------|
| Vercel | フロントエンドホスティング |
| Cloudflare Workers | バックエンドホスティング |
| pnpm | パッケージマネージャー |
| ESLint 9 | リンター |
| GitHub Actions | CI/CD |

---

## ディレクトリ構成

```
attendance-manager/
├── backend/                    # Cloudflare Workers API
│   └── src/
│       ├── index.ts            # エントリーポイント
│       ├── routes/
│       │   ├── auth/           # 認証 (login, register, logout, me)
│       │   ├── attendance/     # 勤怠 (clock, breaks, queries)
│       │   ├── admin/          # 管理者 (users)
│       │   └── daily-reports.ts
│       ├── middleware/
│       │   └── auth.ts         # JWT認証ミドルウェア
│       └── types/
│           ├── env.ts          # 環境変数型定義
│           └── supabase.ts     # DB型定義
│
├── frontend/                   # Next.js App Router
│   ├── app/
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # トップページ（リダイレクト）
│   │   ├── (public)/           # 公開ページ（URLに含まれない）
│   │   │   ├── login/          # /login
│   │   │   └── sign-up/        # /sign-up
│   │   └── (auth)/             # 認証必須ページ（URLに含まれない）
│   │       ├── layout.tsx      # requireAuth()
│   │       ├── dashboard/      # /dashboard
│   │       ├── attendance-history/ # /attendance-history
│   │       └── (admin)/        # 管理者専用（URLに含まれない）
│   │           ├── layout.tsx  # requireAdmin()
│   │           ├── admin/      # /admin
│   │           └── report-list/ # /report-list
│   ├── components/
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   ├── Header/             # ヘッダー（Server + Client Components）
│   │   ├── Footer.tsx
│   │   └── ...
│   └── lib/
│       ├── api-client.ts       # APIクライアント（credentials: include）
│       ├── auth/
│       │   ├── server.ts       # 認証ユーティリティ (getUser, requireAuth, requireAdmin)
│       │   └── with-retry.ts   # SWR用401エラーハンドリング
│       ├── get-base-url.ts     # ベースURL取得
│       └── exportCsv.ts        # CSVエクスポート
│
├── shared/                     # 共有コード
│   ├── types/                  # 共有型定義
│   │   ├── Attendance.ts
│   │   ├── DailyReport.ts
│   │   └── ApiResponse.ts
│   └── lib/                    # 共有ユーティリティ
│
├── .github/workflows/
│   └── ci.yml                  # GitHub Actions CI
│
├── pnpm-workspace.yaml         # pnpm ワークスペース設定
└── tsconfig.base.json          # 共通 TypeScript 設定
```

---

## 認証アーキテクチャ

Server Component中心のシンプルな認証フロー：

- **クライアント直接通信**: ブラウザからHono APIへ直接リクエスト（`credentials: "include"`）
- **HttpOnly Cookie**: JWTトークンをセキュアに保存、自動送信
- **Route Groups**: URLに影響を与えずにアクセス制御を適用

### Route Groups

| Route Group | 認証 | 含まれるページ |
|-------------|------|---------------|
| `(public)` | 不要 | /login, /sign-up |
| `(auth)` | 必須 | /dashboard, /attendance-history |
| `(auth)/(admin)` | 管理者のみ | /admin, /report-list |

---

## 開発環境のセットアップ

### 前提条件
- Node.js 20+
- pnpm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/TAM-ABLE/attendance-manager.git
cd attendance-manager

# 依存関係をインストール（ルートから全パッケージ）
pnpm install
```

### 環境変数

#### Backend (`backend/.dev.vars`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
SLACK_WEBHOOK_URL=your_slack_webhook_url (optional)
```

#### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

---

## 開発コマンド

### Backend
```bash
cd backend
pnpm dev              # 開発サーバー起動 (localhost:8787)
pnpm deploy           # Cloudflare Workers にデプロイ
pnpm lint             # ESLint 実行
pnpm tsc --noEmit     # 型チェック
pnpm cf-typegen       # Cloudflare バインディング型生成
```

### Frontend
```bash
cd frontend
pnpm dev              # 開発サーバー起動 (localhost:3000)
pnpm build            # プロダクションビルド
pnpm lint             # ESLint 実行
pnpm tsc --noEmit     # 型チェック
```

---

## API エンドポイント

### 認証
| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/auth/login` | ログイン |
| POST | `/auth/register` | 新規登録 |
| POST | `/auth/logout` | ログアウト |
| GET | `/auth/me` | 現在のユーザー情報取得 |

### 勤怠
| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/attendance/clock-in` | 出勤打刻 |
| POST | `/attendance/clock-out` | 退勤打刻 |
| POST | `/attendance/break-start` | 休憩開始 |
| POST | `/attendance/break-end` | 休憩終了 |
| GET | `/attendance/today` | 本日の勤怠取得 |
| GET | `/attendance/history` | 勤怠履歴取得 |

### 管理者
| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/admin/users` | ユーザー一覧取得 |
| GET | `/admin/attendance` | 勤怠データ取得 |
| PUT | `/admin/attendance/:id` | 勤怠データ編集 |

---

## CI/CD

GitHub Actions による自動チェック（main/develop ブランチへの push/PR 時）:
- Backend: lint + 型チェック
- Frontend: lint + 型チェック

---

## ライセンス

Private
