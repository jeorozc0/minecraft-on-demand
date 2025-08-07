import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Cache the browser client to avoid re-creating it on every call
let cachedBrowserClient: SupabaseClient | null = null

export function createClient() {
  if (cachedBrowserClient) return cachedBrowserClient
  cachedBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return cachedBrowserClient
}
