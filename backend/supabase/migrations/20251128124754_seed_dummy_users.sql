-- ================================================
-- ダミーユーザー 4 名
-- ================================================
INSERT INTO public.users (id, name, email, employee_number, role, hashed_password)
VALUES
    ('00000000-0000-0000-0000-000000000001', '管理者', 'admin@example.com', 'A001', 'admin', '$2b$12$RUB8JDWpQrLFUTkWCdPHte2rqQCjdG1x0B8sCgvkz4bI50NNBC.Sm'),
    ('00000000-0000-0000-0000-000000000002', '一般ユーザー', 'user@example.com', 'U001', 'user', '$2b$12$RUB8JDWpQrLFUTkWCdPHte2rqQCjdG1x0B8sCgvkz4bI50NNBC.Sm'),
    ('00000000-0000-0000-0000-000000000003', '田中 太郎', 'taro@example.com', 'U002', 'user', '$2b$12$RUB8JDWpQrLFUTkWCdPHte2rqQCjdG1x0B8sCgvkz4bI50NNBC.Sm'),
    ('00000000-0000-0000-0000-000000000004', '鈴木 花子', 'hanako@example.com', 'U003', 'user', '$2b$12$RUB8JDWpQrLFUTkWCdPHte2rqQCjdG1x0B8sCgvkz4bI50NNBC.Sm')
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 管理者（9:00–18:00 / 休憩 12:00–13:00 / JST）
-- ================================================
DO $$
DECLARE
    d DATE;
    att_id UUID;
BEGIN
    FOR d IN
        SELECT generate_series('2025-12-01'::date, '2025-12-31'::date, interval '1 day')
    LOOP
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            INSERT INTO public.attendance_records (user_id, date)
            VALUES ('00000000-0000-0000-0000-000000000001', d)
            RETURNING id INTO att_id;

            INSERT INTO public.work_sessions (attendance_id, clock_in, clock_out)
            VALUES (
                att_id,
                (d::timestamp + TIME '09:00') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '18:00') AT TIME ZONE 'Asia/Tokyo'
            );

            INSERT INTO public.breaks (session_id, break_start, break_end)
            VALUES (
                (SELECT id FROM public.work_sessions WHERE attendance_id = att_id LIMIT 1),
                (d::timestamp + TIME '12:00') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '13:00') AT TIME ZONE 'Asia/Tokyo'
            );
        END IF;
    END LOOP;
END $$;

-- ================================================
-- 一般ユーザー（軽いランダム / JST）
-- ================================================
DO $$
DECLARE
    d DATE;
    att_id UUID;
BEGIN
    FOR d IN
        SELECT generate_series('2025-12-01'::date, '2025-12-31'::date, interval '1 day')
    LOOP
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            INSERT INTO public.attendance_records (user_id, date)
            VALUES ('00000000-0000-0000-0000-000000000002', d)
            RETURNING id INTO att_id;

            INSERT INTO public.work_sessions (attendance_id, clock_in, clock_out)
            VALUES (
                att_id,
                (d::timestamp + (CASE WHEN EXTRACT(DAY FROM d) % 3 = 0 THEN TIME '09:30' ELSE TIME '09:00' END)) AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + (CASE WHEN EXTRACT(DAY FROM d) % 5 = 0 THEN TIME '17:30' ELSE TIME '18:00' END)) AT TIME ZONE 'Asia/Tokyo'
            );

            INSERT INTO public.breaks (session_id, break_start, break_end)
            VALUES (
                (SELECT id FROM public.work_sessions WHERE attendance_id = att_id LIMIT 1),
                (d::timestamp + TIME '12:30') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '13:15') AT TIME ZONE 'Asia/Tokyo'
            );
        END IF;
    END LOOP;
END $$;

-- ================================================
-- 田中太郎（早番 8:30–17:00 / JST）
-- ================================================
DO $$
DECLARE
    d DATE;
    att_id UUID;
BEGIN
    FOR d IN
        SELECT generate_series('2025-12-01'::date, '2025-12-31'::date, interval '1 day')
    LOOP
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            INSERT INTO public.attendance_records (user_id, date)
            VALUES ('00000000-0000-0000-0000-000000000003', d)
            RETURNING id INTO att_id;

            INSERT INTO public.work_sessions (attendance_id, clock_in, clock_out)
            VALUES (
                att_id,
                (d::timestamp + TIME '08:30') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '17:00') AT TIME ZONE 'Asia/Tokyo'
            );

            INSERT INTO public.breaks (session_id, break_start, break_end)
            VALUES (
                (SELECT id FROM public.work_sessions WHERE attendance_id = att_id LIMIT 1),
                (d::timestamp + TIME '12:00') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '12:45') AT TIME ZONE 'Asia/Tokyo'
            );
        END IF;
    END LOOP;
END $$;

-- ================================================
-- 鈴木花子（遅番 10:00–19:00 / JST）
-- ================================================
DO $$
DECLARE
    d DATE;
    att_id UUID;
BEGIN
    FOR d IN
        SELECT generate_series('2025-12-01'::date, '2025-12-31'::date, interval '1 day')
    LOOP
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            INSERT INTO public.attendance_records (user_id, date)
            VALUES ('00000000-0000-0000-0000-000000000004', d)
            RETURNING id INTO att_id;

            INSERT INTO public.work_sessions (attendance_id, clock_in, clock_out)
            VALUES (
                att_id,
                (d::timestamp + TIME '10:00') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '19:00') AT TIME ZONE 'Asia/Tokyo'
            );

            INSERT INTO public.breaks (session_id, break_start, break_end)
            VALUES (
                (SELECT id FROM public.work_sessions WHERE attendance_id = att_id LIMIT 1),
                (d::timestamp + TIME '13:00') AT TIME ZONE 'Asia/Tokyo',
                (d::timestamp + TIME '14:00') AT TIME ZONE 'Asia/Tokyo'
            );
        END IF;
    END LOOP;
END $$;
