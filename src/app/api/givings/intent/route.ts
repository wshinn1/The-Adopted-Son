import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, amountCents, isRecurring, note } = await request.json()

    if (!name || !email || !amountCents || amountCents < 100) {
      return NextResponse.json({ error: 'Invalid giving details' }, { status: 400 })
    }

    if (isRecurring) {
      // Create a SetupIntent for recurring giving — subscription created after payment method confirmed
      const customer = await stripe.customers.create({
        name,
        email,
        phone: phone || undefined,
        metadata: { donor_name: name, donor_email: email, donor_phone: phone ?? '', note: note ?? '' },
      })

      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        usage: 'off_session',
        metadata: {
          donor_name: name,
          donor_email: email,
          donor_phone: phone ?? '',
          amount_cents: String(amountCents),
          note: note ?? '',
          is_recurring: 'true',
        },
      })

      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        type: 'setup',
        customerId: customer.id,
      })
    }

    // One-time payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        donor_name: name,
        donor_email: email,
        donor_phone: phone ?? '',
        note: note ?? '',
        is_recurring: 'false',
      },
      automatic_payment_methods: { enabled: true },
    })

    // Pre-insert giving record in pending state
    await supabaseAdmin.from('givings').insert({
      donor_name: name,
      donor_email: email,
      donor_phone: phone ?? null,
      amount_cents: amountCents,
      is_recurring: false,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
      note: note ?? null,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      type: 'payment',
    })
  } catch (err) {
    console.error('Giving intent error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
