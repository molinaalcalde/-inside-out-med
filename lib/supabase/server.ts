import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  return createClient(supabaseUrl, key, { auth: { persistSession: false } })
}
