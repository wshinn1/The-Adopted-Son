import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// This endpoint syncs the current user's subscription status from Stripe
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // If no stripe_customer_id, try to find by email
    if (!customerId && profile.email) {
      const customers = await stripe.customers.list({
        email: profile.email,
        limit: 1,
      })
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No Stripe customer found for this account' 
      })
    }

    // Get the customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // No active subscription, update profile accordingly
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabaseAdmin
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          subscription_status: 'inactive',
        })
        .eq('id', user.id)

      return NextResponse.json({ 
        success: true, 
        message: 'No active subscription found',
        subscription_status: 'inactive'
      })
    }

    // Get subscription details
    const sub = subscriptions.data[0]
    const interval = sub.items.data[0]?.price?.recurring?.interval
    const plan = interval === 'year' ? 'annual' : 'monthly'
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

    // Update profile with subscription info using admin client
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_period_end: periodEnd,
        stripe_customer_id: customerId,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Failed to update profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      subscription_status: 'active',
      subscription_plan: plan,
      subscription_period_end: periodEnd,
    })
  } catch (error) {
    console.error('Sync subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
