import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewsletterWelcomeEmail } from '@/lib/email'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendAdminSubscriberNotification(firstName: string, email: string) {
  try {
    // Check if notification is enabled in site settings
    const { data: setting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'notify_new_subscribers')
      .single()

    const isEnabled = setting?.value === 'true' || setting?.value === true
    if (!isEnabled) return

    // Get admin email from settings or use default
    const { data: adminEmailSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_notification_email')
      .single()

    const adminEmail = adminEmailSetting?.value?.replace(/"/g, '') || 'weshinn@gmail.com'

    if (!resend) {
      console.log('[newsletter] Resend not configured, skipping admin notification')
      return
    }

    const subscribedAt = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    await resend.emails.send({
      from: 'The Adopted Son <noreply@theadoptedson.com>',
      to: adminEmail,
      subject: `New Subscriber: ${firstName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #1a1a1a;">New Newsletter Subscriber</h1>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Name</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 500; color: #1a1a1a;">${firstName}</p>
            
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Email</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 500; color: #1a1a1a;">${email}</p>
            
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Subscribed</p>
            <p style="margin: 0; font-size: 14px; color: #1a1a1a;">${subscribedAt}</p>
          </div>
          
          <p style="font-size: 13px; color: #999; margin: 0;">
            <a href="https://www.theadoptedson.com/admin/subscribers" style="color: #B87333;">View all subscribers</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[newsletter] Error sending admin notification:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!firstName?.trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    // Check if this is a new subscriber (not re-subscribe)
    const { data: existingSubscriber } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    const isNewSubscriber = !existingSubscriber

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
    if (!dbError && isNewSubscriber) {
      await sendNewsletterWelcomeEmail(email.toLowerCase().trim(), firstName.trim())
      
      // 3. Send admin notification if enabled
      await sendAdminSubscriberNotification(firstName.trim(), email.toLowerCase().trim())
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
