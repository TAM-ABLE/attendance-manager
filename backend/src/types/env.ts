export type Env = {
    SLACK_BOT_TOKEN: string;
    SLACK_CHANNEL_ID: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    // Cookie 設定用
    NODE_ENV?: string;
    COOKIE_CROSS_ORIGIN?: string;
};