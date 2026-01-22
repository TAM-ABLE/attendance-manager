# Frontend - 勤怠管理システム

Next.js 16 + React 19 で構築されたフロントエンドアプリケーション。

## 開発コマンド

```bash
pnpm install          # 依存関係インストール
pnpm dev              # 開発サーバー起動 (localhost:3000)
pnpm build            # 本番ビルド
pnpm lint             # Biome + ESLint (Next.js ルール) 実行
pnpm lint:fix         # lint 自動修正
pnpm format           # コードフォーマット (Biome)
pnpm tsc --noEmit     # 型チェック
```

## アーキテクチャ

### 認証設計

Cookie の責務を Next.js に集約し、Hono は Pure API として Authorization ヘッダーのみを信頼する設計：

```
┌─────────────────────────────────────────────────────────┐
│                    認証フロー                            │
├─────────────────────────────────────────────────────────┤
│  ログイン/登録                                           │
│    └─ Client Component から /api/auth/* (Route Handler)│
│        └─ Route Handler: Hono にリクエスト転送          │
│        └─ Route Handler: Cookie に accessToken 設定    │
│                                                         │
│  API リクエスト (認証済み)                               │
│    └─ Client Component から /api/proxy/* 経由          │
│        └─ proxy.ts: Cookie → Authorization ヘッダー変換│
│        └─ proxy.ts: Hono へリクエストをリライト          │
│                                                         │
│  認証チェック                                            │
│    └─ Route Groups レイアウト                           │
│        ├─ (auth)/layout.tsx → requireAuth()            │
│        └─ (auth)/(admin)/layout.tsx → requireAdmin()   │
│                                                         │
│  ユーザー情報取得                                         │
│    └─ lib/auth/server.ts → getUser()                   │
│        └─ Cookie → Authorization ヘッダー変換           │
│        └─ React cache() でリクエスト内キャッシュ          │
└─────────────────────────────────────────────────────────┘
```

### ディレクトリ構造

```
frontend/
├── proxy.ts                    # Cookie→Bearer変換 + Honoへリライト
├── app/
│   ├── layout.tsx              # ルートレイアウト (Header/Footer)
│   ├── page.tsx                # トップページ (/)
│   ├── api/auth/               # 認証 Route Handler
│   │   ├── login/route.ts      # ログイン + Cookie設定
│   │   ├── register/route.ts   # 登録 + Cookie設定
│   │   └── logout/route.ts     # Cookie削除
│   ├── (auth)/                 # 認証必須ページ (URLに含まれない)
│   │   ├── layout.tsx          # requireAuth()
│   │   ├── dashboard/          # /dashboard
│   │   ├── attendance-history/ # /attendance-history
│   │   └── (admin)/            # 管理者専用 (URLに含まれない)
│   │       ├── layout.tsx      # requireAdmin()
│   │       ├── admin/          # /admin
│   │       └── report-list/    # /report-list
│   └── (public)/               # 公開ページ (URLに含まれない)
│       ├── login/              # /login
│       └── sign-up/            # /sign-up
├── components/
│   ├── Header/                 # ヘッダー (Server + Client Components)
│   ├── Footer/                 # フッター
│   └── ui/                     # shadcn/ui コンポーネント
├── lib/
│   ├── auth/
│   │   ├── server.ts           # 認証ユーティリティ (getUser, requireAuth, requireAdmin)
│   │   └── with-retry.ts       # 401エラー時リダイレクト
│   ├── api-client.ts           # APIクライアント（/api/proxy経由）
│   ├── swr-keys.ts             # SWRキャッシュキー定義
│   └── utils.ts                # cn()関数 (shadcn/ui)
└── hooks/
    ├── useDialogState.ts       # ダイアログ状態管理
    └── useUserSelect.ts        # ユーザー選択
```

### Route Groups

URLパスに影響を与えずにルートをグループ化し、共通の認証チェックを適用：

| Route Group | 認証 | 含まれるページ |
|-------------|------|---------------|
| `(public)` | 不要 | /login, /sign-up |
| `(auth)` | 必須 | /dashboard, /attendance-history |
| `(auth)/(admin)` | 管理者のみ | /admin, /report-list |

### 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4 + shadcn/ui
- **データフェッチ**: SWR
- **バリデーション**: Zod
- **認証**: Server Components + HttpOnly Cookie + proxy.ts（Cookie→Bearer変換）

## 主要ファイル

### 認証関連

| ファイル | 役割 |
|---------|------|
| `proxy.ts` | Cookie→Bearer変換 + Honoへリライト |
| `app/api/auth/login/route.ts` | ログイン + Cookie設定 |
| `app/api/auth/register/route.ts` | ユーザー登録 + Cookie設定 |
| `app/api/auth/logout/route.ts` | Cookie削除 |
| `lib/auth/server.ts` | Server Component用認証（getUser, requireAuth, requireAdmin） |
| `lib/auth/with-retry.ts` | 401エラー時リダイレクト |
| `lib/api-client.ts` | APIクライアント（/api/proxy経由） |
| `app/(auth)/layout.tsx` | 認証必須レイアウト |
| `app/(auth)/(admin)/layout.tsx` | 管理者専用レイアウト |
