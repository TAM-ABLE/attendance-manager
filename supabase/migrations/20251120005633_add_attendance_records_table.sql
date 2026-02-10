-- ============================
-- attendance_records
-- ============================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT attendance_records_user_date_unique UNIQUE (user_id, date)
);
