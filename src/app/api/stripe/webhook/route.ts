import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendSubscriptionWelcomeEmail, sendPaymentReceiptEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const email = session.customer_details?.email

      if (!email) {
        console.error('No email found in checkout session')
        break
      }

      // Find profile by email (case insensitive)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .single()

      if (!profile) {
        console.error(`No profile found for email: ${email}`)
        break
      }

      // Fetch subscription details
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id
        const lookupKey = sub.items.data[0]?.price?.lookup_key
        
        // Determine plan name from price
        let plan = 'monthly'
        if (lookupKey) {
          plan = lookupKey
        } else if (priceId) {
          // Check if it's annual based on interval
          const interval = sub.items.data[0]?.price?.recurring?.interval
          plan = interval === 'year' ? 'annual' : 'monthly'
        }
        
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString()
        const amount = sub.items.data[0]?.price?.unit_amount ?? 0

        // Update profile with subscription info
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            subscription_period_end: periodEnd,
            stripe_customer_id: customerId,
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Failed to update profile:', error)
        } else {
          // Send welcome email
          await sendSubscriptionWelcomeEmail(email, plan === 'annual' ? 'Annual' : 'Monthly')
          
          // Send payment receipt
          await sendPaymentReceiptEmail(email, {
            planName: plan === 'annual' ? 'Annual Subscription' : 'Monthly Subscription',
            amount: amount / 100,
            periodEnd: new Date(sub.current_period_end * 1000),
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      const status = sub.status === 'active' ? 'active' : 'inactive'

      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: status,
          subscription_period_end: periodEnd,
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'inactive',
          subscription_plan: null,
          subscription_period_end: null,
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const subscriptionId = invoice.subscription as string
      
      // Only send receipt for recurring payments (not the first one - that's handled by checkout.session.completed)
      if (invoice.billing_reason === 'subscription_cycle' && subscriptionId) {
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
        const email = customer.email
        
        if (email) {
          // Get subscription details
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const interval = sub.items.data[0]?.price?.recurring?.interval
          const plan = interval === 'year' ? 'annual' : 'monthly'
          const amount = invoice.amount_paid / 100
          const periodEnd = new Date(sub.current_period_end * 1000)
          
          // Update subscription period end
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_period_end: periodEnd.toISOString(),
            })
            .eq('stripe_customer_id', customerId)
          
          // Send receipt email
          await sendPaymentReceiptEmail(email, {
            planName: plan === 'annual' ? 'Annual Subscription' : 'Monthly Subscription',
            amount,
            periodEnd,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
