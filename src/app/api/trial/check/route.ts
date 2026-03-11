import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service-role client to bypass RLS for visitor_trials
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(request: NextRequest) {
  try {
    const ip = request.nextUrl.searchParams.get('ip')
    if (!ip) return NextResponse.json({ hasAccess: true }, { status: 200 }) // Allow access if no IP

    const { data, error } = await supabaseAdmin
      .from('visitor_trials')
      .select('trial_ends_at, converted_to_paid')
      .eq('ip_address', ip)
      .single()

    if (error || !data) {
      // No trial found — start one (14 days from now)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)
      
      await supabaseAdmin.from('visitor_trials').upsert(
        { 
          ip_address: ip,
          trial_ends_at: trialEndsAt.toISOString(),
        },
        { onConflict: 'ip_address' },
      )
      return NextResponse.json({ hasAccess: true, newTrial: true, trialEndsAt: trialEndsAt.toISOString() })
    }

    if (data.converted_to_paid) {
      // User has subscribed - they should use login for access
      return NextResponse.json({ hasAccess: false, converted: true })
    }

    const trialEndsAt = new Date(data.trial_ends_at)
    const now = new Date()

    if (now < trialEndsAt) {
      // Trial is still active
      return NextResponse.json({
        hasAccess: true,
        trialEndsAt: data.trial_ends_at,
      })
    }

    // Trial has expired
    return NextResponse.json({ hasAccess: false, expired: true })
  } catch (error) {
    console.error('Trial check error:', error)
    // Fail open - allow access if there's an error
    return NextResponse.json({ hasAccess: true })
  }
}
