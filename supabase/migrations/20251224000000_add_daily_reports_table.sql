-- ============================
-- daily_reports (日報)
-- ============================
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    date date NOT NULL,
    summary text,                              -- まとめ・所感
    issues text,                               -- 困っていること・課題
    notes text,                                -- 連絡事項
    submitted_at timestamptz,                  -- 提出日時（NULLなら下書き、値があれば提出済）
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
    -- 1日に複数の日報を作成可能（UNIQUE制約なし）
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON public.daily_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports (date);
