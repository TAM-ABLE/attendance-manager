import { createRoute, z } from "@hono/zod-openapi"
import { generateMonthDates, parseYearMonth } from "@/lib/time"
import { generateMonthlyAttendanceCsv } from "../../lib/csv"
import { databaseError, internalError, successResponse, validationError } from "../../lib/errors"
import { formatAttendanceRecord } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import {
  errorResponseSchema,
  successResponseSchema,
  yearMonthSchema,
} from "../../lib/openapi-schemas"
import { createRepos, DatabaseError } from "../../lib/repositories"
import { uploadCsvToSlack } from "../../lib/slack-csv"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"

const closeMonthRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

const closeMonthRoute = createRoute({
  method: "post",
  path: "/month/{yearMonth}/close",
  tags: ["勤怠"],
  summary: "月次勤怠締め（CSV Slack送信）",
  description: "指定月の勤怠データをCSV化してSlackに送信します。",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      yearMonth: yearMonthSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema(
            z.object({
              message: z.string(),
            }),
          ),
        },
      },
      description: "送信成功",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "バリデーションエラー",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "サーバーエラー",
    },
  },
})

closeMonthRouter.openapi(closeMonthRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { yearMonth } = c.req.valid("param")

  const parsed = parseYearMonth(yearMonth)
  if (!parsed) {
    return validationError(c, "Invalid year-month format")
  }
  const { year, month } = parsed

  const botToken = c.env.SLACK_BOT_TOKEN
  const channelId = c.env.SLACK_CSV_CHANNEL_ID
  if (!botToken || !channelId) {
    return internalError(c, "SLACK_BOT_TOKEN or SLACK_CSV_CHANNEL_ID not configured")
  }

  const { attendance, profile } = createRepos(c.env)

  try {
    const user = await profile.findById(userId)

    const monthDates = generateMonthDates(year, month)
    const startDate = monthDates[0]
    const endDate = monthDates[monthDates.length - 1]

    const dbRecords = await attendance.findRecordsByDateRange(userId, startDate, endDate)
    const records = dbRecords.map(formatAttendanceRecord)

    const yearMonthStr = `${year}${String(month).padStart(2, "0")}`
    const fileName = `${user.name}_${yearMonthStr}_attendance.csv`
    const csvBuffer = generateMonthlyAttendanceCsv(monthDates, records, user.name)

    const initialComment = `${user.name}さんの${year}年${month}月の勤怠を締めました。`
    const result = await uploadCsvToSlack(botToken, channelId, fileName, csvBuffer, initialComment)
    if (!result.success) {
      return internalError(c, `Slack upload failed: ${result.error}`)
    }

    return successResponse(c, {
      message: `${year}年${month}月の勤怠CSVをSlackに送信しました。`,
    })
  } catch (e) {
    if (e instanceof DatabaseError) return databaseError(c, e.message)
    throw e
  }
})

export default closeMonthRouter
