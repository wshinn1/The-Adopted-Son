import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export type TrialStatus =
  | { hasAccess: true; reason: 'subscribed' | 'trial_active' | 'admin' }
  | { hasAccess: false; reason: 'trial_expired' | 'no_trial' | 'unauthenticated' }

export async function checkAccess(): Promise<TrialStatus> {
  const supabase = await createClient()

  // Check authenticated user first
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, subscription_status, subscription_period_end')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) return { hasAccess: true, reason: 'admin' }

    if (
      profile?.subscription_status === 'active' &&
      profile?.subscription_period_end &&
      new Date(profile.subscription_period_end) > new Date()
    ) {
      return { hasAccess: true, reason: 'subscribed' }
    }
  }

  // Check IP-based trial for anonymous visitors
  const ip = await getClientIP()

  // Determine base URL - use NEXT_PUBLIC_APP_URL, VERCEL_URL, or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'

  // Use service role via API route for visitor_trials (RLS blocks anon)
  try {
    const response = await fetch(
      `${baseUrl}/api/trial/check?ip=${encodeURIComponent(ip)}`,
      { cache: 'no-store' },
    )

    if (response?.ok) {
      const data = await response.json()
      
      // Trial is active (either existing or newly created)
      if (data.hasAccess) {
        return { hasAccess: true, reason: 'trial_active' }
      }
      
      // Trial has expired - user needs to subscribe
      if (data.expired) {
        return { hasAccess: false, reason: 'trial_expired' }
      }
    }
  } catch (error) {
    // If trial check fails, still allow access (fail open for better UX)
    console.error('Trial check failed:', error)
    return { hasAccess: true, reason: 'trial_active' }
  }

  // Fallback: allow access if we couldn't determine trial status
  // This ensures content is always visible unless explicitly expired
  return { hasAccess: true, reason: 'trial_active' }
}
