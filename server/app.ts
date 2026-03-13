import { createOpenAPIHono } from "./lib/openapi-hono"
import { type AuthVariables, adminMiddleware, authMiddleware } from "./middleware/auth"
import adminRoute from "./routes/admin"
import attendanceRoute from "./routes/attendance"
import authRoute from "./routes/auth"
import dailyReportsRoute from "./routes/daily-reports"
import type { Env } from "./types/env"

const app = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>().basePath("/api")

// Next.js環境では c.env が自動設定されないため、process.env から注入する
// 必須環境変数のバリデーションもリクエスト時に行う（ビルド時のモジュール評価でthrowしないように）
app.use("*", async (c, next) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required")
  }
  c.env = {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    JWT_SECRET: process.env.JWT_SECRET,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ?? "",
    SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ?? "",
    SLACK_ICON_CLOCK_IN: process.env.SLACK_ICON_CLOCK_IN,
    SLACK_ICON_CLOCK_OUT: process.env.SLACK_ICON_CLOCK_OUT,
    SLACK_ICON_ATTENDANCE_CLOSE: process.env.SLACK_ICON_ATTENDANCE_CLOSE,
    NODE_ENV: process.env.NODE_ENV,
    SLACK_CSV_CHANNEL_ID: process.env.SLACK_CSV_CHANNEL_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    APP_URL: process.env.APP_URL,
  } as Env
  await next()
})

// /api/auth/me のみ認証が必要
app.use("/auth/me", authMiddleware)
// /api/auth（login, logout, set-password は認証不要）
app.route("/auth", authRoute)

// 認証が必要なルート: /api/attendance/*
app.use("/attendance/*", authMiddleware)
app.route("/attendance", attendanceRoute)

// 認証 + 管理者権限が必要なルート: /api/admin/*
app.use("/admin/*", authMiddleware, adminMiddleware)
app.route("/admin", adminRoute)

// 認証が必要なルート: /api/daily-reports/*
app.use("/daily-reports/*", authMiddleware)
app.route("/daily-reports", dailyReportsRoute)

// OpenAPI 仕様書 + Swagger UI（開発環境のみ）
// 動的importにより本番バンドルから @hono/swagger-ui を除外
if (process.env.NODE_ENV !== "production") {
  import("./lib/swagger").then(({ registerSwagger }) => registerSwagger(app))
}

export default app
