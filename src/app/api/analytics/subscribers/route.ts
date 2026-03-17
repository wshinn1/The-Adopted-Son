import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function GET() {
  try {
    // ===== STRIPE DATA =====
    // Get paid subscribers from Stripe (active subscriptions)
    let stripePaidSubscribers = 0
    let stripeNewSubscribers7d = 0
    let stripeTotalCustomers = 0
    const stripeSignupsByDate: Record<string, number> = {}
    
    try {
      // Count active subscriptions
      const activeSubscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
      })
      stripePaidSubscribers = activeSubscriptions.data.length
      
      // Also count trialing subscriptions as they're still paid subscribers
      const trialingSubscriptions = await stripe.subscriptions.list({
        status: 'trialing',
        limit: 100,
      })
      stripePaidSubscribers += trialingSubscriptions.data.length

      // Get total customers
      const customers = await stripe.customers.list({ limit: 100 })
      stripeTotalCustomers = customers.data.length

      // Get new subscriptions in last 7 days
      const sevenDaysAgoTimestamp = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
      const recentSubscriptions = await stripe.subscriptions.list({
        created: { gte: sevenDaysAgoTimestamp },
        limit: 100,
      })
      stripeNewSubscribers7d = recentSubscriptions.data.length

      // Get subscription signups for last 14 days for the chart
      const fourteenDaysAgoTimestamp = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000)
      const recentSubsForChart = await stripe.subscriptions.list({
        created: { gte: fourteenDaysAgoTimestamp },
        limit: 100,
      })
      
      recentSubsForChart.data.forEach(sub => {
        const date = new Date(sub.created * 1000).toISOString().split('T')[0]
        stripeSignupsByDate[date] = (stripeSignupsByDate[date] || 0) + 1
      })
    } catch (stripeErr) {
      console.error('[v0] Stripe error (continuing with Supabase data):', stripeErr)
    }

    // ===== SUPABASE DATA (Newsletter/Email Subscribers) =====
    // Get total email subscribers (newsletter signups)
    const { count: emailSubscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    // Get new email subscribers in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newEmailSubscribers7d } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get daily email subscriber signups for last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: dailyEmailSignups } = await supabaseAdmin
      .from('subscribers')
      .select('created_at')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group email signups by date
    const emailSignupsByDate: Record<string, number> = {}
    dailyEmailSignups?.forEach(sub => {
      const date = new Date(sub.created_at).toISOString().split('T')[0]
      emailSignupsByDate[date] = (emailSignupsByDate[date] || 0) + 1
    })

    // Combine Stripe and email signups for the chart (use Stripe data if available)
    const dailyData: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      // Prefer Stripe subscription data, fall back to email signups
      const stripeCount = stripeSignupsByDate[dateStr] || 0
      const emailCount = emailSignupsByDate[dateStr] || 0
      dailyData.push({
        date: dateStr,
        count: stripeCount + emailCount // Combined
      })
    }

    // Get total devotionals
    const { count: totalDevotionals } = await supabaseAdmin
      .from('devotionals')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get popular devotionals by title (for display)
    const { data: popularDevotionals } = await supabaseAdmin
      .from('devotionals')
      .select('id, title, slug, view_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(10)

    // Total subscribers = Stripe customers + email-only subscribers
    const totalSubscribers = stripeTotalCustomers + (emailSubscribers ?? 0)
    // New this week = Stripe new subs + email new subs
    const newSubscribers7d = stripeNewSubscribers7d + (newEmailSubscribers7d ?? 0)

    return NextResponse.json({
      totalSubscribers,
      newSubscribers7d,
      paidSubscribers: stripePaidSubscribers, // From Stripe only
      totalDevotionals: totalDevotionals ?? 0,
      dailySignups: dailyData,
      popularDevotionals: popularDevotionals ?? [],
      // Additional breakdown for transparency
      breakdown: {
        stripeCustomers: stripeTotalCustomers,
        stripeActiveSubscriptions: stripePaidSubscribers,
        emailSubscribers: emailSubscribers ?? 0,
      }
    })
  } catch (err) {
    console.error('[v0] Subscriber stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriber stats' }, { status: 500 })
  }
}
