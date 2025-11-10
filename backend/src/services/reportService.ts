// src/services/reportService.ts

import { sendSlackNotification } from './slackService'

export type DailyReport = {
    name: string
    tasks: string
    feedback: string
    problem?: string
    notice?: string
}

export const sendReportToSlack = async (
    report: DailyReport,
    env: { SLACK_WEBHOOK_URL: string }
) => {
    const message = `
  *日報報告*
  名前: ${report.name}
  今日行ったこと: ${report.tasks}
  感想・気づき: ${report.feedback}
  困っていること: ${report.problem ?? 'なし'}
  連絡事項: ${report.notice ?? 'なし'}
  `
    await sendSlackNotification(message, env)
}