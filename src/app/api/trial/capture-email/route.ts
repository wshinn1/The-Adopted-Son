import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Add subscriber to Moosend mailing list
async function addToMoosend(email: string) {
  const apiKey = process.env.MOOSEND_API_KEY
  const listId = process.env.MOOSEND_LIST_ID

  if (!apiKey || !listId) {
    console.log('Moosend not configured, skipping')
    return
  }

  try {
    const response = await fetch(
      `https://api.moosend.com/v3/subscribers/${listId}/subscribe.json?apikey=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: email,
          HasExternalDoubleOptIn: false,
          CustomFields: [
            'Source=trial_banner',
            `TrialStarted=${new Date().toISOString()}`
          ]
        }),
      }
    )

    if (!response.ok) {
      console.error('Moosend API error:', await response.text())
    }
  } catch (error) {
    console.error('Failed to add to Moosend:', error)
  }
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  // Get IP from request headers (Vercel provides this)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Update visitor_trials record with email
  const { data: existingTrial } = await supabaseAdmin
    .from('visitor_trials')
    .update({ email })
    .eq('ip_address', ip)
    .select()
    .single()

  // Always add to subscribers table
  await supabaseAdmin
    .from('subscribers')
    .upsert({ 
      email, 
      source: 'trial_banner',
      subscribed_at: new Date().toISOString()
    }, { 
      onConflict: 'email' 
    })

  // Add to Moosend mailing list
  await addToMoosend(email)

  return NextResponse.json({ success: true })
}
