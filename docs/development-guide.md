# 開発環境ガイド

ローカル開発環境のセットアップと各サービスの起動方法について説明します。

## 前提条件

- Node.js 20+
- pnpm
- Docker（Supabase ローカル環境に必要）
- Windows の場合: WSL2 + Docker Desktop for Windows

> **Windows ユーザー**: Docker Desktop をインストールし、Settings > Resources > WSL Integration で WSL2 ディストリビューションを有効にしてください。以降の操作はすべて WSL2 上で行います。

### pnpm のインストール

```bash
# Node.js 16.13+ に組み込みの corepack を使う（推奨）
corepack enable

# または npm でグローバルインストール
npm install -g pnpm
```

---

## 1. 依存関係のインストール

```bash
pnpm install
```

---

## 2. Supabase CLI

### インストール

```bash
# macOS / Linux / WSL2（Homebrew）
brew install supabase/tap/supabase

# Homebrew なしの場合
curl -sSL https://supabase.com/install.sh | bash
```

> **Note**: インストール後、`supabase --version` でバージョンを確認できます。

### ローカル環境の起動

```bash
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

# CLI のアップデート
brew upgrade supabase
```

### マイグレーション

```bash
# マイグレーションファイルの作成
supabase migration new <migration_name>

# マイグレーション実行（ローカル）
supabase db push

# DBをリセット（マイグレーション + シード再実行）
supabase db reset

# リモート（本番）へマイグレーション実行
supabase db push --linked
```

### 型の自動生成

Supabase CLI はデータベーススキーマから TypeScript の型定義を自動生成できます。マイグレーション実行後やスキーマ変更後に型を再生成してください。

```bash
# ローカル Supabase から型を生成（Supabase が起動している必要あり）
pnpm gen:types
```

生成先: `server/types/supabase.ts`

このファイルには `Database` 型が定義されており、Supabase クライアントの型安全な操作に使用されます。

> **重要**: マイグレーションでテーブルやカラムを変更した場合は、必ず `pnpm gen:types` を実行して型定義を最新の状態に保ってください。

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

## 3. アプリケーション（Next.js + Hono API）

### 環境変数の設定

`.env.local` を作成：

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<supabase status で表示される service_role key>
JWT_SECRET=<任意の文字列>
SLACK_BOT_TOKEN=<Slack Bot Token（任意）>
SLACK_CHANNEL_ID=<Slack Channel ID（任意）>
```

> **Note**: ローカル Supabase の service_role key は `supabase status` で確認できます。

### 起動

```bash
pnpm dev
```

起動後:
- アプリ: http://localhost:3000
- Swagger UI: http://localhost:3000/api/ui
- OpenAPI spec: http://localhost:3000/api/doc

### その他のコマンド

```bash
pnpm build         # プロダクションビルド
pnpm lint          # Biome + ESLint 実行
pnpm lint:fix      # lint 自動修正
pnpm format        # コードフォーマット
pnpm tsc --noEmit  # 型チェック
```

---

## 4. 開発時の起動順序

1. **Supabase** を起動
   ```bash
   supabase start
   ```

2. **アプリケーション** を起動
   ```bash
   pnpm dev
   ```

3. ブラウザで http://localhost:3000 にアクセス

---

## 5. トラブルシューティング

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
- `pnpm dev -p 3001` で別ポート指定

### 認証エラー

1. `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認
2. `supabase status` で最新のキーを取得して更新
