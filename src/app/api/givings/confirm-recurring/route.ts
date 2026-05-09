import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { setupIntentId, customerId } = await request.json()

    if (!setupIntentId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment method not confirmed' }, { status: 400 })
    }

    const meta = setupIntent.metadata ?? {}
    const amountCents = parseInt(meta.amount_cents ?? '0', 10)

    if (!amountCents) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Find or create a monthly price for this amount
    const priceKey = `monthly_giving_${amountCents}`
    const existingPrices = await stripe.prices.list({
      lookup_keys: [priceKey],
      limit: 1,
    })

    let price: Stripe.Price
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0]
    } else {
      price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: amountCents,
        recurring: { interval: 'month' },
        lookup_key: priceKey,
        product_data: { name: 'Monthly Giving — The Adopted Son' },
      })
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: setupIntent.payment_method as string,
      metadata: {
        donor_name: meta.donor_name ?? '',
        donor_email: meta.donor_email ?? '',
        donor_phone: meta.donor_phone ?? '',
        note: meta.note ?? '',
        amount_cents: String(amountCents),
      },
    })

    // Insert giving record for first payment
    const latestInvoice = subscription.latest_invoice
    const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id
    const piId = typeof latestInvoice === 'object' && latestInvoice
      ? (typeof latestInvoice.payment_intent === 'string' ? latestInvoice.payment_intent : latestInvoice.payment_intent?.id)
      : null

    await supabaseAdmin.from('givings').insert({
      donor_name: meta.donor_name ?? '',
      donor_email: meta.donor_email ?? '',
      donor_phone: meta.donor_phone ?? null,
      amount_cents: amountCents,
      is_recurring: true,
      stripe_subscription_id: subscription.id,
      stripe_payment_intent_id: piId ?? null,
      status: subscription.status === 'active' ? 'succeeded' : 'pending',
      note: meta.note ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Confirm recurring error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to confirm recurring giving' },
      { status: 500 }
    )
  }
}
