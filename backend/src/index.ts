// backend/src/index.ts
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import authRoute from "./routes/auth";
import attendanceRoute from "./routes/attendance";
import adminRoute from "./routes/admin";
import dailyReportsRoute from "./routes/daily-reports";
import { authMiddleware, adminMiddleware, AuthVariables } from "./middleware/auth";
import { Env } from "./types/env";
import { createOpenAPIHono } from "../lib/openapi-hono";

const app = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

// グローバル CORS（Authorization ヘッダーを許可）
app.use(
    "*",
    cors({
        origin: (origin) => {
            // 開発環境: localhost からのリクエストを許可
            if (origin?.startsWith("http://localhost")) {
                return origin;
            }
            // 本番環境: 適切なオリジンを設定（環境変数で管理推奨）
            return origin ?? "";
        },
        credentials: true,
    })
);

// 認証不要: /auth
app.route("/auth", authRoute);

// 認証が必要なルート: /attendance/*
app.use("/attendance/*", authMiddleware);
app.route("/attendance", attendanceRoute);

// 認証 + 管理者権限が必要なルート: /admin/*
app.use("/admin/*", authMiddleware, adminMiddleware);
app.route("/admin", adminRoute);

// 認証 + 管理者権限が必要なルート: /daily-reports/*
app.use("/daily-reports/*", authMiddleware, adminMiddleware);
app.route("/daily-reports", dailyReportsRoute);

// OpenAPI 仕様書エンドポイント
app.doc("/doc", {
    openapi: "3.0.0",
    info: {
        title: "勤怠管理システム API",
        version: "1.0.0",
        description: "勤怠管理・日報システムのAPI仕様書",
    },
    // servers は空配列にすることで、現在のホストを自動的に使用
    servers: [],
    tags: [
        { name: "認証", description: "ログイン・ユーザー登録" },
        { name: "勤怠", description: "出勤・退勤・休憩管理" },
        { name: "管理者", description: "管理者用のユーザー・勤怠管理" },
        { name: "日報", description: "日報の閲覧" },
    ],
    security: [
        {
            Bearer: [],
        },
    ],
});

// OpenAPI セキュリティスキーム定義
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT認証トークン",
});

// Swagger UI
app.get("/ui", swaggerUI({ url: "/doc" }));

export default app;
