import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  // Verify admin session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, cancelImmediately } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Get the subscription ID from the profile
  const adminClient = createClient()
  const { data: target } = await (await adminClient)
    .from('profiles')
    .select('stripe_subscription_id, stripe_customer_id, email')
    .eq('id', userId)
    .single()

  if (!target?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 400 })
  }

  try {
    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(target.stripe_subscription_id)
    } else {
      // Cancel at period end (default — they keep access until renewal date)
      await stripe.subscriptions.update(target.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    return NextResponse.json({ success: true, cancelImmediately })
  } catch (err: any) {
    console.error('Stripe cancel error:', err)
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 })
  }
}
