'use server'

import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'

export async function startCheckoutSession(planId: string) {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Plan "${planId}" not found`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
