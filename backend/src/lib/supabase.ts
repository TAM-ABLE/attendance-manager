// backend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = (env: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};