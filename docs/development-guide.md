# 開発環境ガイド

ローカル開発環境のセットアップと各サービスの起動方法について説明します。

## 前提条件

- Node.js 20+
- pnpm
- Docker（Supabase ローカル環境に必要）

---

## 1. 依存関係のインストール

```bash
# リポジトリルートで実行（全パッケージの依存関係をインストール）
pnpm install
```

---

## 2. Supabase CLI

### インストール

```bash
# macOS
brew install supabase/tap/supabase

# Linux
brew install supabase/tap/supabase
# または
curl -sSL https://supabase.com/install.sh | bash

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm（どのOSでも可）
npm install -g supabase
```

### ローカル環境の起動

```bash
cd backend

# Supabase ローカル環境を起動（Docker が必要）
supabase start
```

起動後、以下の URL でアクセスできます：

| サービス | URL | 説明 |
|---------|-----|------|
| Supabase Studio | http://localhost:54323 | DB管理UI |
| API | http://localhost:54321 | Supabase REST API |
| Database | localhost:54322 | PostgreSQL 直接接続 |
| Inbucket | http://localhost:54324 | メールテスト用UI |

### よく使うコマンド

```bash
# ステータス確認（URL・キー情報も表示）
supabase status

# 停止
supabase stop

# 完全リセット（データも削除）
supabase stop --no-backup
supabase start
```

### マイグレーション

```bash
# マイグレーションファイルの作成
supabase migration new <migration_name>
# → backend/supabase/migrations/<timestamp>_<migration_name>.sql が作成される

# マイグレーション実行（ローカル）
supabase db push

# DBをリセット（マイグレーション + シード再実行）
supabase db reset

# リモート（本番）へマイグレーション実行
supabase db push --linked
```

### シードデータ

シードファイル: `backend/supabase/seed.sql`

```bash
# シードを含めてDBリセット
supabase db reset
```

### リモートプロジェクトとの連携

```bash
# Supabase プロジェクトにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref <project-ref>

# リモートDBの状態を確認
supabase db diff
```

---

## 3. バックエンド（Hono + Cloudflare Workers）

### 環境変数の設定

`backend/.dev.vars` を作成：

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<supabase status で表示される anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase status で表示される service_role key>
JWT_SECRET=<任意の文字列>
SLACK_WEBHOOK_URL=<Slack Webhook URL（任意）>
```

> **Note**: ローカル Supabase の anon key / service_role key は `supabase status` で確認できます。

### 起動

```bash
cd backend
pnpm dev
```

起動後:
- API: http://localhost:8787
- Swagger UI: http://localhost:8787/ui
- OpenAPI spec: http://localhost:8787/doc

### その他のコマンド

```bash
pnpm lint          # Biome lint 実行
pnpm lint:fix      # lint 自動修正
pnpm format        # コードフォーマット
pnpm tsc --noEmit  # 型チェック
pnpm deploy        # Cloudflare Workers にデプロイ
```

---

## 4. フロントエンド（Next.js）

### 環境変数の設定

`frontend/.env.local` を作成：

```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 起動

```bash
cd frontend
pnpm dev
```

起動後: http://localhost:3000

### その他のコマンド

```bash
pnpm build         # プロダクションビルド
pnpm lint          # Biome + ESLint 実行
pnpm lint:fix      # lint 自動修正
pnpm format        # コードフォーマット
pnpm tsc --noEmit  # 型チェック
```

---

## 5. 開発時の起動順序

1. **Supabase** を起動
   ```bash
   cd backend && supabase start
   ```

2. **バックエンド** を起動
   ```bash
   cd backend && pnpm dev
   ```

3. **フロントエンド** を起動（別ターミナル）
   ```bash
   cd frontend && pnpm dev
   ```

4. ブラウザで http://localhost:3000 にアクセス

---

## 6. トラブルシューティング

### Supabase が起動しない

```bash
# Docker が起動しているか確認
docker ps

# Supabase のログを確認
supabase logs

# 完全にリセットして再起動
supabase stop --no-backup
supabase start
```

### ポートが使用中

デフォルトポートが使用中の場合:
- Supabase: `backend/supabase/config.toml` でポート変更可能
- Backend: `wrangler.jsonc` で `port` を変更
- Frontend: `pnpm dev -- -p 3001` で別ポート指定

### 認証エラー

1. `.dev.vars` の `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認
2. `supabase status` で最新のキーを取得して更新
