import { errorResponseSchema } from "./openapi-schemas"

const errorResponse = (description: string) =>
  ({
    content: { "application/json": { schema: errorResponseSchema } },
    description,
  }) as const

export const validationErrorResponse = errorResponse("バリデーションエラー")
export const unauthorizedResponse = errorResponse("認証エラー")
export const forbiddenResponse = (description: string) => errorResponse(description)
export const notFoundResponse = (description: string) => errorResponse(description)
export const serverErrorResponse = errorResponse("サーバーエラー")
