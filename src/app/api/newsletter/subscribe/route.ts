import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { firstName, email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!firstName?.trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    // 1. Save to Supabase newsletter_subscribers table
    const { error: dbError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert(
        { email: email.toLowerCase().trim(), first_name: firstName.trim() },
        { onConflict: 'email' },
      )

    if (dbError) {
      console.error('[newsletter] DB error:', dbError)
    }

    // 2. Send welcome email (only on first-time subscribe, not re-subscribe)
    if (!dbError) {
      await sendNewsletterWelcomeEmail(email.toLowerCase().trim(), firstName.trim())
    }

    // 3. Add to Moosend
    const moosendApiKey = process.env.MOOSEND_API_KEY
    const moosendListId = process.env.MOOSEND_LIST_ID

    if (moosendApiKey && moosendListId) {
      try {
        const moosendRes = await fetch(
          `https://api.moosend.com/v3/subscribers/${moosendListId}/subscribe.json?apikey=${moosendApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Email: email.toLowerCase().trim(),
              Name: firstName.trim(),
              CustomFields: [],
            }),
          },
        )
        const moosendData = await moosendRes.json()
        if (!moosendRes.ok) {
          console.error('[newsletter] Moosend error:', moosendData)
        }
      } catch (err) {
        console.error('[newsletter] Moosend request failed:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
