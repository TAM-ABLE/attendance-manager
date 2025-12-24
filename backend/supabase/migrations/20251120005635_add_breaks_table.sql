-- ============================
-- breaks
-- ============================
CREATE TABLE IF NOT EXISTS public.breaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.work_sessions (id) ON DELETE CASCADE,
    break_start timestamptz NOT NULL,
    break_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
