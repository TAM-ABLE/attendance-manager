// backend/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase'

export const getSupabaseClient = (env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; JWT_SECRET: string; }): SupabaseClient<Database> => {
    return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}