export type Env = {
  DATABASE_URL: string
  SLACK_BOT_TOKEN?: string
  SLACK_CHANNEL_ID?: string
  SLACK_ICON_CLOCK_IN?: string
  SLACK_ICON_CLOCK_OUT?: string
  SLACK_ICON_ATTENDANCE_CLOSE?: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
  NODE_ENV?: string
  SLACK_CSV_CHANNEL_ID?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
}
