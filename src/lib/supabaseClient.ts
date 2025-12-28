import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// do not mix import.meta.env and process.env via a shared "env" object
// support both Vite runtime (import.meta.env) and plain Node (process.env)
const isServer = typeof window === 'undefined'

// pick the env source depending on runtime
const supabaseUrl = isServer ? process.env.VITE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL // <-- CHANGE
const supabasePublishableKey = isServer
  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const msg = 'Supabase env vars missing: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY'

if (!supabaseUrl || !supabasePublishableKey) {
  //only throw on the server; in the browser just warn so dev doesn't hard-crash
  if (isServer) throw new Error(msg)
  console.warn(msg)
}

export const supabase: SupabaseClient = createClient(supabaseUrl ?? '', supabasePublishableKey ?? '')
