# メール配信セットアップガイド（管理者向け）

招待メール・パスワードリセットメールの配信設定ガイドです。

---

## メール配信の仕組み

本システムでは **Resend API** を使用してメールを送信します。

- ユーザー登録時: GoTrue `/admin/generate_link` でリンク生成 → Resend API で招待メール送信
- パスワードリセット時: GoTrue `/admin/generate_link` でリンク生成 → Resend API でリセットメール送信
- メールテンプレート: `server/lib/resend.ts` にインライン定義

---

## 必要な環境変数

| 環境変数 | 説明 | 例 |
|---------|------|-----|
| `RESEND_API_KEY` | Resend の API キー | `re_xxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | 送信元メールアドレス | `noreply@tamable.co.jp` |
| `APP_URL` | アプリケーションの本番 URL | `https://attendance.tamable.co.jp` |

---

## セットアップ手順

### 1. Resend アカウント作成

1. [Resend](https://resend.com/) でアカウント作成
2. 無料プラン（月3,000通）で十分

### 2. ドメイン認証

Resend から `tamable.co.jp` ドメインでメールを送信するには、DNS レコードの追加が必要です。

1. Resend 管理画面で `tamable.co.jp` を登録
2. 表示される DNS レコード（TXT, MX 等）をドメインの DNS 管理画面で追加
3. Resend 側でドメイン認証の完了を確認

### 3. API キー発行

1. Resend 管理画面 → API Keys → Create API Key
2. 発行されたキーを本番環境の環境変数 `RESEND_API_KEY` に設定

### 4. 環境変数の設定

本番環境（Vercel 等）に以下の環境変数を設定：

```
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tamable.co.jp
APP_URL=https://attendance.tamable.co.jp
```

---

## ローカル開発

ローカル開発では `RESEND_API_KEY` が未設定のため、メール送信時にエラーが返ります。
メールのリンク生成自体は GoTrue が行うため、ローカルでのメール動作確認が必要な場合は Resend のテスト用 API キーを `.env.local` に設定してください。

---

## トラブルシューティング

### メールが届かない場合

| # | 確認項目 | 確認方法 |
|---|---------|---------|
| 1 | **迷惑メールフォルダ** | 受信者のメールクライアントで迷惑メールフォルダを確認 |
| 2 | **メールアドレスの入力ミス** | 管理画面のユーザー一覧で登録メールアドレスを確認 |
| 3 | **環境変数の設定** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL` が正しく設定されているか確認 |
| 4 | **ドメイン認証** | Resend 管理画面でドメインが認証済みか確認 |
| 5 | **Resend ダッシュボード** | Resend の Logs でメール送信状況・エラーを確認 |
| 6 | **Supabase ログ** | Supabase Dashboard → Logs → Auth で GoTrue エラーがないか確認 |
