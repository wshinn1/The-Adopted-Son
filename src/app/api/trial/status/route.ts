import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Service-role client to bypass RLS for visitor_trials
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function GET(request: NextRequest) {
  const ip = await getClientIP()

  const { data, error } = await supabaseAdmin
    .from('visitor_trials')
    .select('trial_ends_at, converted_to_paid')
    .eq('ip_address', ip)
    .single()

  if (error || !data) {
    // No trial found — start one
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)
    
    await supabaseAdmin.from('visitor_trials').upsert(
      { 
        ip_address: ip,
        trial_ends_at: trialEndsAt.toISOString(),
      },
      { onConflict: 'ip_address' },
    )
    
    return NextResponse.json({ 
      hasAccess: true, 
      newTrial: true,
      daysLeft: 14,
      expired: false,
    })
  }

  if (data.converted_to_paid) {
    return NextResponse.json({ 
      hasAccess: false, 
      converted: true,
      expired: false,
    })
  }

  const trialEndsAt = new Date(data.trial_ends_at)
  const now = new Date()
  const diffMs = trialEndsAt.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  if (now < trialEndsAt) {
    return NextResponse.json({
      hasAccess: true,
      trialEndsAt: data.trial_ends_at,
      daysLeft,
      expired: false,
    })
  }

  return NextResponse.json({ 
    hasAccess: false, 
    expired: true,
    daysLeft: 0,
  })
}
