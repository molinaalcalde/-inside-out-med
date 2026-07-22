import { createClient } from '@supabase/supabase-js'

// Server-side client with service role for admin operations (bypasses RLS)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Fall back to anon key if service role not available
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}
