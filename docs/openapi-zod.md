# OpenAPI + Zod アーキテクチャ

## 概要

本プロジェクトでは **@hono/zod-openapi** を使用して、Zodスキーマから OpenAPI 仕様を自動生成しています。

```
Zodスキーマ定義 → OpenAPI仕様（JSON）→ Swagger UI で確認
       ↓
  バリデーション + TypeScript型
```

### なぜ zod-openapi を使うのか

| 機能 | Zod単体 | + zod-openapi |
|------|---------|---------------|
| バリデーション | ✅ | ✅ |
| TypeScript型生成 | ✅ | ✅ |
| APIドキュメント自動生成 | ❌ | ✅ |
| Swagger UIでテスト | ❌ | ✅ |

**メリット**:
- コードとドキュメントが常に同期（Single Source of Truth）
- フロントエンド開発者がSwagger UIでAPIを確認・テスト可能
- 手書きドキュメントの保守が不要

## Swagger UI へのアクセス

```bash
cd backend
pnpm dev
```

- **Swagger UI**: http://localhost:8787/ui
- **OpenAPI仕様（JSON）**: http://localhost:8787/doc

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `backend/lib/openapi-schemas.ts` | Zodスキーマ定義（リクエスト/レスポンス） |
| `backend/lib/openapi-hono.ts` | OpenAPIHono のファクトリ関数 |
| `backend/src/index.ts` | Swagger UI・OpenAPI仕様エンドポイント設定 |
| `backend/src/routes/**/*.ts` | 各ルートの定義 |

## スキーマ定義の書き方

### 基本スキーマ

`@hono/zod-openapi` の `z` を使用し、`.openapi()` でメタデータを追加します。

```typescript
// backend/lib/openapi-schemas.ts
import { z } from "@hono/zod-openapi"

// 基本スキーマ（説明とサンプル値を追加）
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({
  description: "日付 (YYYY-MM-DD形式)",
  example: "2025-01-15",
})

export const uuidSchema = z.string().uuid().openapi({
  description: "UUID",
  example: "550e8400-e29b-41d4-a716-446655440000",
})
```

### オブジェクトスキーマ

`.openapi("スキーマ名")` でOpenAPI上の名前を定義します。

```typescript
export const loginRequestSchema = z
  .object({
    email: z.string().email().openapi({
      description: "メールアドレス",
      example: "user@example.com",
    }),
    password: z.string().min(1).openapi({
      description: "パスワード",
      example: "password123",
    }),
  })
  .openapi("LoginRequest")  // ← OpenAPI上のスキーマ名

// TypeScript型を export
export type LoginRequest = z.infer<typeof loginRequestSchema>
```

### レスポンススキーマ

成功・エラーレスポンスの統一形式:

```typescript
// 成功レスポンス
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

// エラーレスポンス
export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  })
  .openapi("ErrorResponse")
```

## ルート定義の書き方

### 1. createRoute でルート定義

```typescript
// backend/src/routes/auth/login.ts
import { createRoute } from "@hono/zod-openapi"
import {
  loginRequestSchema,
  loginResponseSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../../../lib/openapi-schemas"

const loginRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["認証"],                    // Swagger UIでのグループ分け
  summary: "ログイン",               // 簡潔な説明
  description: "メールアドレスとパスワードでログインし、JWTトークンを取得します。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(loginResponseSchema),
        },
      },
      description: "ログイン成功",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "バリデーションエラー",
    },
    401: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "認証エラー",
    },
  },
})
```

### 2. ルーターとハンドラーを結合

```typescript
import { createOpenAPIHono } from "../../../lib/openapi-hono"
import type { Env } from "../../types/env"

const loginRouter = createOpenAPIHono<{ Bindings: Env }>()

loginRouter.openapi(loginRoute, async (c) => {
  // バリデーション済みデータを型安全に取得
  const { email, password } = c.req.valid("json")

  // ビジネスロジック
  const result = await authenticate(email, password)

  // レスポンス
  return c.json({ success: true, data: result })
})

export default loginRouter
```

### パスパラメータ・クエリパラメータ

```typescript
const getUserRoute = createRoute({
  method: "get",
  path: "/{userId}/attendance/{date}",
  request: {
    params: z.object({
      userId: uuidSchema,
      date: dateSchema,
    }),
    query: z.object({
      includeBreaks: z.coerce.boolean().optional(),
    }),
  },
  // ...
})

// ハンドラーでの取得
router.openapi(getUserRoute, async (c) => {
  const { userId, date } = c.req.valid("param")
  const { includeBreaks } = c.req.valid("query")
  // ...
})
```

## バリデーションエラーのカスタマイズ

`backend/lib/openapi-hono.ts` で統一されたエラーレスポンスを設定:

```typescript
import { OpenAPIHono } from "@hono/zod-openapi"

export function createOpenAPIHono<E extends Env = Env>() {
  return new OpenAPIHono<E>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const firstIssue = result.error.issues[0]
        const message = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Validation failed"
        return c.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message },
          },
          400,
        )
      }
    },
  })
}
```

## 新しいエンドポイントを追加する手順

1. **スキーマ定義**（`backend/lib/openapi-schemas.ts`）
   - リクエスト/レスポンスのZodスキーマを追加
   - `.openapi()` でメタデータを追加

2. **ルート定義**（`backend/src/routes/[domain]/[action].ts`）
   - `createRoute` でルート定義
   - `router.openapi()` でハンドラー結合

3. **ルーターをマウント**（`backend/src/index.ts`）
   - 必要に応じて新しいルーターをマウント

4. **確認**
   - http://localhost:8787/ui でSwagger UIを確認
   - 新しいエンドポイントが表示されているか確認

## タグ（グループ分け）

`backend/src/index.ts` でタグを定義:

```typescript
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "勤怠管理システム API",
    version: "1.0.0",
  },
  tags: [
    { name: "認証", description: "ログイン・ユーザー登録" },
    { name: "勤怠", description: "出勤・退勤・休憩管理" },
    { name: "管理者", description: "管理者用のユーザー・勤怠管理" },
    { name: "日報", description: "日報の閲覧" },
  ],
})
```

各ルート定義で `tags: ["認証"]` のように指定すると、Swagger UI上でグループ化されます。

## 認証設定

Bearer Token 認証の設定:

```typescript
// backend/src/index.ts

// セキュリティスキーム定義
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT認証トークン",
})

// グローバルセキュリティ設定
app.doc("/doc", {
  // ...
  security: [{ Bearer: [] }],
})
```

Swagger UI の「Authorize」ボタンからJWTトークンを入力すると、認証付きリクエストをテストできます。
