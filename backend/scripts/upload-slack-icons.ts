// backend/scripts/upload-slack-icons.ts
// Slack通知用アイコンをSupabase Storageにアップロードするスクリプト
//
// 使い方:
//   1. backend/assets/slack-icons/ に画像ファイルを配置
//      - clock-in.png  (出勤用)
//      - clock-out.png (退勤用)
//   2. pnpm upload:slack-icons を実行

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数の読み込み（.envファイルから）
function loadEnv(): { supabaseUrl: string; supabaseKey: string } {
  const envPath = path.join(__dirname, "..", ".env")
  const envContent = fs.readFileSync(envPath, "utf-8")

  const env: Record<string, string> = {}
  for (const line of envContent.split("\n")) {
    const [key, ...valueParts] = line.split("=")
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim()
    }
  }

  const supabaseUrl = env.SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env")
  }

  return { supabaseUrl, supabaseKey }
}

const BUCKET_NAME = "slack-icons"
const ASSETS_DIR = path.join(__dirname, "..", "assets", "slack-icons")

const ICONS = [
  { filename: "clock-in.png", envVar: "SLACK_ICON_CLOCK_IN" },
  { filename: "clock-out.png", envVar: "SLACK_ICON_CLOCK_OUT" },
]

async function main() {
  console.log("🚀 Slack アイコンアップロードスクリプト\n")

  // 環境変数の読み込み
  const { supabaseUrl, supabaseKey } = loadEnv()
  const supabase = createClient(supabaseUrl, supabaseKey)

  // バケットの確認・作成
  console.log(`📦 バケット "${BUCKET_NAME}" を確認中...`)
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

  if (!bucketExists) {
    console.log("   バケットを作成中...")
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
    })
    if (error) {
      throw new Error(`バケット作成失敗: ${error.message}`)
    }
    console.log("   ✅ バケット作成完了\n")
  } else {
    console.log("   ✅ バケットは既に存在します\n")
  }

  // アイコンのアップロード
  const uploadedUrls: Record<string, string> = {}

  for (const icon of ICONS) {
    const filePath = path.join(ASSETS_DIR, icon.filename)

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${icon.filename} が見つかりません (${ASSETS_DIR})`)
      console.log("   スキップします...\n")
      continue
    }

    console.log(`📤 ${icon.filename} をアップロード中...`)

    const fileBuffer = fs.readFileSync(filePath)
    const contentType = icon.filename.endsWith(".png")
      ? "image/png"
      : icon.filename.endsWith(".jpg") || icon.filename.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/gif"

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(icon.filename, fileBuffer, {
      contentType,
      upsert: true, // 既存ファイルを上書き
    })

    if (error) {
      console.log(`   ❌ アップロード失敗: ${error.message}\n`)
      continue
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(icon.filename)

    uploadedUrls[icon.envVar] = publicUrl
    console.log("   ✅ アップロード完了")
    console.log(`   URL: ${publicUrl}\n`)
  }

  // 環境変数の出力
  if (Object.keys(uploadedUrls).length > 0) {
    console.log("━".repeat(50))
    console.log("📋 以下の環境変数を設定してください:\n")
    console.log("# .env / .dev.vars / Cloudflare Workers secrets")
    for (const [envVar, url] of Object.entries(uploadedUrls)) {
      console.log(`${envVar}=${url}`)
    }
    console.log("\n━".repeat(50))
  }
}

main().catch((err) => {
  console.error("❌ エラー:", err.message)
  process.exit(1)
})
