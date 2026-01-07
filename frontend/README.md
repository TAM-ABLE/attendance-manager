# Frontend - 勤怠管理システム

Next.js 16 + React 19 で構築されたフロントエンドアプリケーション。

## 開発コマンド

```bash
pnpm install          # 依存関係インストール
pnpm dev              # 開発サーバー起動 (localhost:3000)
pnpm build            # 本番ビルド
pnpm lint             # ESLint実行
pnpm tsc --noEmit     # 型チェック
```

## アーキテクチャ

### 認証設計

Server Component中心のシンプルな認証フロー：

```
┌─────────────────────────────────────────────────────────┐
│                    認証フロー                            │
├─────────────────────────────────────────────────────────┤
│  ログイン/登録                                           │
│    └─ Server Actions (app/actions/auth.ts)             │
│        └─ Cookie設定 (httpOnly)                        │
│                                                         │
│  認証チェック                                            │
│    └─ Route Groups レイアウト                           │
│        ├─ (auth)/layout.tsx → requireAuth()            │
│        └─ (auth)/(admin)/layout.tsx → requireAdmin()   │
│                                                         │
│  ユーザー情報取得                                         │
│    └─ lib/auth/server.ts → getUser()                   │
│        └─ React cache() でリクエスト内キャッシュ          │
└─────────────────────────────────────────────────────────┘
```

### ディレクトリ構造

```
frontend/
├── app/
│   ├── layout.tsx              # ルートレイアウト (Header/Footer)
│   ├── page.tsx                # トップページ (/)
│   ├── actions/
│   │   └── auth.ts             # Server Actions (login, register, logout)
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
│   │   └── with-retry.ts       # クライアント側401エラーハンドリング
│   ├── api-client.ts           # Server Actions用APIクライアント
│   ├── get-base-url.ts         # ベースURL取得（共通）
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
- **認証**: Server Components + HttpOnly Cookie

## 主要ファイル

### 認証関連

| ファイル | 役割 |
|---------|------|
| `lib/auth/server.ts` | Server Component用認証（getUser, requireAuth, requireAdmin） |
| `lib/auth/with-retry.ts` | SWR用401エラーハンドリング |
| `app/actions/auth.ts` | Server Actions（login, register, logout） |
| `app/(auth)/layout.tsx` | 認証必須レイアウト |
| `app/(auth)/(admin)/layout.tsx` | 管理者専用レイアウト |

### API通信

| ファイル | 役割 |
|---------|------|
| `lib/api-client.ts` | Server Actions用APIクライアント（タイムアウト、エラーハンドリング） |
| `lib/get-base-url.ts` | 環境に応じたベースURL取得 |
