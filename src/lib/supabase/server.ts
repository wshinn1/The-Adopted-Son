import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from Server Component — safe to ignore if middleware refreshes sessions
          }
        },
      },
      auth: {
        // Disable PKCE flow - use implicit flow with token_hash instead
        // PKCE requires cookies to persist between signup and email click,
        // which fails when users open email links in different browsers/apps
        flowType: 'implicit',
      },
    },
  )
}
