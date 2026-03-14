import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const ipHash = hashIP(ip)

    // Get popup settings for reshow_days
    const { data: settingsData } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'popup_settings')
      .single()

    const settings = settingsData?.value 
      ? (typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value)
      : { reshow_days: 4 }

    const reshowDays = settings.reshow_days || 4

    // Check if user has dismissed popup recently
    const { data: dismissal } = await supabaseAdmin
      .from('popup_dismissals')
      .select('dismissed_at, subscribed')
      .eq('ip_hash', ipHash)
      .order('dismissed_at', { ascending: false })
      .limit(1)
      .single()

    if (dismissal) {
      // If user has subscribed, never show again
      if (dismissal.subscribed) {
        return NextResponse.json({ shouldShow: false, reason: 'subscribed' })
      }

      // Check if enough days have passed since last dismissal
      const dismissedAt = new Date(dismissal.dismissed_at)
      const now = new Date()
      const daysSinceDismissal = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceDismissal < reshowDays) {
        return NextResponse.json({ 
          shouldShow: false, 
          reason: 'recently_dismissed',
          daysRemaining: Math.ceil(reshowDays - daysSinceDismissal)
        })
      }
    }

    // Show the popup
    return NextResponse.json({ shouldShow: true })
  } catch (error) {
    console.error('Error checking popup status:', error)
    // On error, don't show popup to avoid annoyance
    return NextResponse.json({ shouldShow: false, reason: 'error' })
  }
}
