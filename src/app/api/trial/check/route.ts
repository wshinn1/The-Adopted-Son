import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service-role client to bypass RLS for visitor_trials
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(request: NextRequest) {
  const ip = request.nextUrl.searchParams.get('ip')
  if (!ip) return NextResponse.json({ hasAccess: false }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('visitor_trials')
    .select('trial_ends_at, converted_to_paid')
    .eq('ip_address', ip)
    .single()

  if (error || !data) {
    // No trial found — start one
    await supabaseAdmin.from('visitor_trials').upsert(
      { ip_address: ip },
      { onConflict: 'ip_address' },
    )
    return NextResponse.json({ hasAccess: true, newTrial: true })
  }

  if (data.converted_to_paid) {
    return NextResponse.json({ hasAccess: false, converted: true })
  }

  const trialEndsAt = new Date(data.trial_ends_at)
  const now = new Date()

  if (now < trialEndsAt) {
    return NextResponse.json({
      hasAccess: true,
      trialEndsAt: data.trial_ends_at,
    })
  }

  return NextResponse.json({ hasAccess: false, expired: true })
}
