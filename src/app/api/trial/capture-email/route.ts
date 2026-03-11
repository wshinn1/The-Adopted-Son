import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  // Get IP from request headers (Vercel provides this)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || 'unknown'

  // First try to update existing visitor_trials record
  const { data: existingTrial, error: updateError } = await supabaseAdmin
    .from('visitor_trials')
    .update({ email })
    .eq('ip_address', ip)
    .select()
    .single()

  // If no existing record found, also add to subscribers table as a fallback
  if (!existingTrial) {
    // Add to subscribers table
    const { error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .upsert({ 
        email, 
        source: 'trial_banner',
        subscribed_at: new Date().toISOString()
      }, { 
        onConflict: 'email' 
      })

    if (subscriberError) {
      console.error('Error adding subscriber:', subscriberError)
    }
  }

  return NextResponse.json({ success: true })
}
