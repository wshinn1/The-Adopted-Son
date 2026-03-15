import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Get total subscribers
    const { count: totalSubscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    // Get new subscribers in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newSubscribers7d } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get new subscribers in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: newSubscribers30d } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get daily subscriber signups for last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: dailySignups } = await supabaseAdmin
      .from('subscribers')
      .select('created_at')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const signupsByDate: Record<string, number> = {}
    dailySignups?.forEach(sub => {
      const date = new Date(sub.created_at).toISOString().split('T')[0]
      signupsByDate[date] = (signupsByDate[date] || 0) + 1
    })

    // Fill in missing dates with 0
    const dailyData: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData.push({
        date: dateStr,
        count: signupsByDate[dateStr] || 0
      })
    }

    // Get total paid subscribers (users with active subscriptions)
    const { count: paidSubscribers } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

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

    return NextResponse.json({
      totalSubscribers: totalSubscribers ?? 0,
      newSubscribers7d: newSubscribers7d ?? 0,
      newSubscribers30d: newSubscribers30d ?? 0,
      paidSubscribers: paidSubscribers ?? 0,
      totalDevotionals: totalDevotionals ?? 0,
      dailySignups: dailyData,
      popularDevotionals: popularDevotionals ?? [],
    })
  } catch (err) {
    console.error('[v0] Subscriber stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriber stats' }, { status: 500 })
  }
}
