import { swaggerUI } from "@hono/swagger-ui"
import { createOpenAPIHono } from "./lib/openapi-hono"
import { type AuthVariables, adminMiddleware, authMiddleware } from "./middleware/auth"
import adminRoute from "./routes/admin"
import attendanceRoute from "./routes/attendance"
import authRoute from "./routes/auth"
import dailyReportsRoute from "./routes/daily-reports"
import type { Env } from "./types/env"

const app = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>().basePath("/api")

// Next.js環境では c.env が自動設定されないため、process.env から注入する
app.use("*", async (c, next) => {
  c.env = {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    JWT_SECRET: process.env.JWT_SECRET ?? "",
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ?? "",
    SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ?? "",
    SLACK_ICON_CLOCK_IN: process.env.SLACK_ICON_CLOCK_IN,
    SLACK_ICON_CLOCK_OUT: process.env.SLACK_ICON_CLOCK_OUT,
    NODE_ENV: process.env.NODE_ENV,
    SLACK_CSV_CHANNEL_ID: process.env.SLACK_CSV_CHANNEL_ID,
  } as Env
  await next()
})

// 認証不要: /api/auth
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

// OpenAPI 仕様書エンドポイント
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "勤怠管理システム API",
    version: "1.0.0",
    description: "勤怠管理・日報システムのAPI仕様書",
  },
  servers: [],
  tags: [
    { name: "認証", description: "ログイン・ログアウト" },
    { name: "勤怠", description: "出勤・退勤・休憩管理" },
    { name: "管理者", description: "管理者用のユーザー・勤怠管理" },
    { name: "日報", description: "日報の閲覧" },
  ],
  security: [
    {
      Bearer: [],
    },
  ],
})

// OpenAPI セキュリティスキーム定義
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT認証トークン",
})

// Swagger UI
app.get("/ui", swaggerUI({ url: "/api/doc" }))

export default app
