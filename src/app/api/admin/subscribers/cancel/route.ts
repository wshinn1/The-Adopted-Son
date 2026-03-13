import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Verify the requester is an admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { profileId, atPeriodEnd = true } = await request.json()
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

  // Fetch the profile to get stripe_subscription_id
  const { data: sub } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id, email, full_name')
    .eq('id', profileId)
    .single()

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No Stripe subscription found for this user' }, { status: 404 })
  }

  // Cancel in Stripe
  const cancelled = await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: atPeriodEnd,
  })

  // If immediate cancellation, also update Supabase directly (webhook will confirm)
  if (!atPeriodEnd) {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'canceled', subscription_plan: null })
      .eq('id', profileId)
  }

  return NextResponse.json({
    success: true,
    cancelAtPeriodEnd: cancelled.cancel_at_period_end,
    periodEnd: new Date(cancelled.current_period_end * 1000).toISOString(),
  })
}
