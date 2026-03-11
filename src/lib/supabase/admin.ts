import { createClient } from '@supabase/supabase-js'

// Service-role client to bypass RLS for public data fetching
// This should only be used server-side for fetching public content
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
