# 勤怠管理・日報システム

## 概要
本システムは、**勤怠管理（出勤・退勤）と日報提出を行う Web アプリケーション**です。  
社員・アルバイトなどの勤務時間管理と日報提出を簡単に行えるように設計されています。

---

## 機能一覧

### 勤怠管理
- 出勤 / 退勤打刻
- 勤務時間の自動集計
- 日 / 週 / 月の勤務時間表示
- 打刻の修正（管理者のみ）
- ユーザー一覧表示（管理者のみ）
- 勤怠データの確認・編集（管理者のみ）
- ユーザーの月の勤怠データをCSV形式でエクスポート（管理者のみ）

### 日報
- 日報の作成 提出

### ユーザー管理
- ログイン / ログアウト
- 権限（管理者 / 一般ユーザー） 

---

## 使用技術

### Frontend
- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Radix UI**
- **shadcn UI スタック**
- **NextAuth.js**
- **SWR**
- **lucide-react**
- **react-day-picker**

### Backend
- **Cloudflare Workers**
- **Hono**
- **TypeScript**
- **Supabase**
- **Hono JWT**
- **Slack API**

### Dev Tools / デプロイ環境
- **Vercel**
- **Cloudflare Workers**
- **Cloudflare Wrangler**
- **ESLint 9**
- **TypeScript 5**
- **npm / pnpm / bun**
- **GitHub Actions**

---

## ディレクトリ構成


