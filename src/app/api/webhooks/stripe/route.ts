import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!customerEmail) return

  // Find or create user profile by email
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single()

  if (existingProfile) {
    // Update existing profile with Stripe info
    await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
      })
      .eq('id', existingProfile.id)
  }

  // Mark trial as converted if they had one
  const ip = session.metadata?.visitor_ip
  if (ip) {
    await supabaseAdmin
      .from('visitor_trials')
      .update({ converted_to_paid: true })
      .eq('ip_address', ip)
  }

  // Also update by email
  await supabaseAdmin
    .from('visitor_trials')
    .update({ converted_to_paid: true })
    .eq('email', customerEmail)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const planId = subscription.metadata?.plan_id || 'unknown'
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  // Map Stripe status to our status
  const subscriptionStatus = 
    status === 'active' ? 'active' :
    status === 'past_due' ? 'past_due' :
    status === 'canceled' ? 'canceled' :
    status === 'trialing' ? 'trialing' : 'inactive'

  // Update profile by stripe_customer_id
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscriptionStatus,
      subscription_plan: planId,
      subscription_period_end: periodEnd,
      stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', customerId)
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_plan: null,
    })
    .eq('stripe_customer_id', customerId)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  // Extend subscription period
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_period_end: periodEnd,
    })
    .eq('stripe_customer_id', customerId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId)
}
