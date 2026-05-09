import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const [
      { count: totalNewsletterSubscribers },
      { count: newNewsletterSubscribers7d },
      { data: dailySignups },
      { count: totalDevotionals },
      { data: popularDevotionals },
      { count: totalGivings },
    ] = await Promise.all([
      supabaseAdmin.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true).gte('subscribed_at', sevenDaysAgo.toISOString()),
      supabaseAdmin.from('newsletter_subscribers').select('subscribed_at').eq('is_active', true).gte('subscribed_at', fourteenDaysAgo.toISOString()).order('subscribed_at', { ascending: true }),
      supabaseAdmin.from('devotionals').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabaseAdmin.from('devotionals').select('id, title, slug, view_count').eq('is_published', true).order('view_count', { ascending: false, nullsFirst: false }).limit(10),
      supabaseAdmin.from('givings').select('*', { count: 'exact', head: true }).eq('status', 'succeeded'),
    ])

    const signupsByDate: Record<string, number> = {}
    dailySignups?.forEach(sub => {
      const date = new Date(sub.subscribed_at).toISOString().split('T')[0]
      signupsByDate[date] = (signupsByDate[date] || 0) + 1
    })

    const dailyData: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData.push({ date: dateStr, count: signupsByDate[dateStr] || 0 })
    }

    return NextResponse.json({
      totalSubscribers: totalNewsletterSubscribers ?? 0,
      newSubscribers7d: newNewsletterSubscribers7d ?? 0,
      totalGivings: totalGivings ?? 0,
      totalDevotionals: totalDevotionals ?? 0,
      dailySignups: dailyData,
      popularDevotionals: popularDevotionals ?? [],
    })
  } catch (err) {
    console.error('Subscriber stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriber stats' }, { status: 500 })
  }
}
