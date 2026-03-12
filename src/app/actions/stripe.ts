'use server'

import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function startCheckoutSession(planId: string) {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Plan "${planId}" not found`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    mode: 'subscription',
    customer_email: user?.email,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        plan_id: plan.id,
        user_id: user?.id ?? '',
      },
    },
  })

  return session.client_secret
}

export async function createCustomerPortalSession(userId: string) {
  // Get user's stripe_customer_id from profiles
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('No Stripe customer found for this user')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theadoptedson.com'}/account`,
  })

  return session.url
}
