import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Support both Vite runtime (import.meta.env) and plain Node (process.env)
const env = (typeof import.meta !== 'undefined' && import.meta?.env) || process.env
const supabaseUrl = env.VITE_SUPABASE_URL
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase env vars missing: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey)
