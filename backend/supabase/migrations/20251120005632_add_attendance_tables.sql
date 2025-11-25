-- ============================
-- users
-- ============================
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    employee_number text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    hashed_password text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- ============================
-- work_sessions
-- ============================
CREATE TABLE IF NOT EXISTS public.work_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id uuid NOT NULL REFERENCES public.attendance_records (id) ON DELETE CASCADE,
    clock_in timestamptz NOT NULL,
    clock_out timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

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