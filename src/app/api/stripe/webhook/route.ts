import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendGivingConfirmationEmail } from '@/lib/email'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent

      await supabaseAdmin
        .from('givings')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', pi.id)

      const { data: giving } = await supabaseAdmin
        .from('givings')
        .select('donor_name, donor_email, amount_cents, is_recurring, note')
        .eq('stripe_payment_intent_id', pi.id)
        .single()

      if (giving?.donor_email) {
        await sendGivingConfirmationEmail(giving.donor_email, {
          name: giving.donor_name,
          amount: giving.amount_cents,
          isRecurring: giving.is_recurring ?? false,
          note: giving.note ?? undefined,
        })
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabaseAdmin
        .from('givings')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', pi.id)
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) return new Response('ok', { status: 200 })

      const subscription = await stripe.subscriptions.retrieve(subId)
      const piId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id
      const meta = subscription.metadata ?? {}
      const amountPaid = invoice.amount_paid

      if (meta.donor_email) {
        await supabaseAdmin
          .from('givings')
          .insert({
            donor_name: meta.donor_name ?? '',
            donor_email: meta.donor_email,
            donor_phone: meta.donor_phone ?? null,
            amount_cents: amountPaid,
            is_recurring: true,
            stripe_subscription_id: subId,
            stripe_payment_intent_id: piId ?? null,
            status: 'succeeded',
            note: meta.note ?? null,
          })

        await sendGivingConfirmationEmail(meta.donor_email, {
          name: meta.donor_name ?? '',
          amount: amountPaid,
          isRecurring: true,
          note: meta.note ?? undefined,
        })
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
}
