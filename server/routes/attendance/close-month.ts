import { createRoute, z } from "@hono/zod-openapi"
import { generateMonthDates, parseYearMonthWithRange } from "@/lib/time"
import { generateMonthlyAttendanceCsv } from "../../lib/csv"
import { handleRouteError, internalError, successResponse, validationError } from "../../lib/errors"
import { formatAttendanceRecord } from "../../lib/formatters"
import { createOpenAPIHono } from "../../lib/openapi-hono"
import { serverErrorResponse, validationErrorResponse } from "../../lib/openapi-responses"
import { successResponseSchema, yearMonthSchema } from "../../lib/openapi-schemas"
import { createRepos } from "../../lib/repositories"
import { getSlackCsvConfig, sendAttendanceCloseNotification } from "../../lib/slack"
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
          schema: successResponseSchema(z.object({ message: z.string() })),
        },
      },
      description: "送信成功",
    },
    400: validationErrorResponse,
    500: serverErrorResponse,
  },
})

closeMonthRouter.openapi(closeMonthRoute, async (c) => {
  const { sub: userId } = c.get("jwtPayload")
  const { yearMonth } = c.req.valid("param")

  const parsed = parseYearMonthWithRange(yearMonth)
  if (!parsed) return validationError(c, "Invalid year-month format")
  const { year, month, start: startDate, end: endDate } = parsed

  const slackConfig = getSlackCsvConfig(c.env)
  if (!slackConfig) {
    return internalError(c, "SLACK_BOT_TOKEN or SLACK_CSV_CHANNEL_ID not configured")
  }

  const { attendance, profile } = createRepos(c.env)

  try {
    const user = await profile.findById(userId)

    const monthDates = generateMonthDates(year, month)

    const dbRecords = await attendance.findRecordsByDateRange(userId, startDate, endDate)
    const records = dbRecords.map(formatAttendanceRecord)

    const yearMonthStr = `${year}${String(month).padStart(2, "0")}`
    const fileName = `${user.name}_${yearMonthStr}_attendance.csv`
    const csvBuffer = generateMonthlyAttendanceCsv(monthDates, records, user.name)

    // アイコン付き通知メッセージを送信
    const notification = await sendAttendanceCloseNotification(slackConfig, user.name, year, month)

    // CSVをスレッドに添付（通知が成功した場合はスレッド返信）
    const result = await uploadCsvToSlack(
      slackConfig.botToken,
      slackConfig.channelId,
      fileName,
      csvBuffer,
      undefined,
      notification.ts,
    )
    if (!result.success) {
      return internalError(c, `Slack upload failed: ${result.error}`)
    }

    return successResponse(c, {
      message: `${year}年${month}月の勤怠CSVをSlackに送信しました。`,
    })
  } catch (e) {
    return handleRouteError(c, e)
  }
})

export default closeMonthRouter
