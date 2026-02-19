export type Env = {
  DATABASE_URL: string
  SLACK_BOT_TOKEN: string
  SLACK_CHANNEL_ID: string
  SLACK_ICON_CLOCK_IN?: string
  SLACK_ICON_CLOCK_OUT?: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
  NODE_ENV?: string
  SLACK_CSV_CHANNEL_ID?: string
}
