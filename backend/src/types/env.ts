export type Env = {
    SLACK_BOT_TOKEN: string;
    SLACK_CHANNEL_ID: string;
    SLACK_ICON_CLOCK_IN?: string;
    SLACK_ICON_CLOCK_OUT?: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    // Cookie 設定用
    NODE_ENV?: string;
    // サブドメイン間でCookieを共有するための親ドメイン（例: .attendance-manager.com）
    COOKIE_DOMAIN?: string;
};