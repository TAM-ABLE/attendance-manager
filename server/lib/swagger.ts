import { swaggerUI } from "@hono/swagger-ui"
import type { OpenAPIHono } from "@hono/zod-openapi"

// biome-ignore lint/suspicious/noExplicitAny: app型パラメータの厳密な一致が不要なため
export function registerSwagger(app: OpenAPIHono<any, any, any>) {
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

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT認証トークン",
  })

  app.get("/ui", swaggerUI({ url: "/api/doc" }))
}
