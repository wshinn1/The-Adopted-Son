import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '341992'
const POSTHOG_API_URL = 'https://us.posthog.com'

async function runQuery(query: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.results ?? []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days') ?? '7'
  const isYesterday = daysParam === '24h'
  const LOOKBACK_DAYS = isYesterday ? 1 : parseInt(daysParam, 10)
  const dateFilter = isYesterday
    ? `timestamp >= now() - INTERVAL 24 HOUR`
    : `timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY`

  try {
    // Batch 1: core metrics
    const [coreResults] = await Promise.all([
      runQuery(`
        SELECT
          count() as pageviews,
          count(DISTINCT distinct_id) as uniques,
          countIf(timestamp >= now() - INTERVAL 5 MINUTE) as active_recent
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
      `),
    ])

    await new Promise(r => setTimeout(r, 100))

    // Batch 2: top pages + daily views
    const [topPagesRows, last7Rows] = await Promise.all([
      runQuery(`
        SELECT
          properties['$current_url'] as page,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
      runQuery(`
        SELECT
          toDate(timestamp) as day,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
        GROUP BY day
        ORDER BY day ASC
      `),
    ])

    await new Promise(r => setTimeout(r, 100))

    // Batch 3: top devotionals + countries
    const [topDevotionalsRows, countriesRows] = await Promise.all([
      runQuery(`
        SELECT
          properties['$current_url'] as page,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
          AND properties['$current_url'] LIKE '%/devotionals/%'
          AND NOT properties['$current_url'] LIKE '%/admin/%'
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
      runQuery(`
        SELECT
          properties['$geoip_country_name'] as country,
          properties['$geoip_country_code'] as countryCode,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
          AND properties['$geoip_country_name'] IS NOT NULL
          AND properties['$geoip_country_name'] != ''
        GROUP BY country, countryCode
        ORDER BY views DESC
        LIMIT 50
      `),
    ])

    await new Promise(r => setTimeout(r, 100))

    // Batch 4: cities + states
    const [citiesRows, statesRows] = await Promise.all([
      runQuery(`
        SELECT
          properties['$geoip_city_name'] as city,
          properties['$geoip_subdivision_1_name'] as state,
          properties['$geoip_country_code'] as countryCode,
          properties['$geoip_country_name'] as country,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
          AND properties['$geoip_city_name'] IS NOT NULL
          AND properties['$geoip_city_name'] != ''
        GROUP BY city, state, countryCode, country
        ORDER BY views DESC
        LIMIT 100
      `),
      runQuery(`
        SELECT
          properties['$geoip_subdivision_1_name'] as state,
          properties['$geoip_country_name'] as country,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND properties['$host'] LIKE '%theadoptedson.com'
          AND ${dateFilter}
          AND properties['$geoip_subdivision_1_name'] IS NOT NULL
          AND properties['$geoip_subdivision_1_name'] != ''
        GROUP BY state, country
        ORDER BY views DESC
        LIMIT 50
      `),
    ])

    // Enrich devotional URLs with titles from Supabase
    const devotionalRows = (topDevotionalsRows ?? []).map((r: [string, number]) => ({
      page: r[0],
      views: r[1],
    }))

    const slugs = devotionalRows
      .map((d: { page: string }) => {
        const match = d.page?.match(/\/devotionals\/([^/?#]+)/)
        return match?.[1] ?? null
      })
      .filter(Boolean) as string[]

    let titleMap = new Map<string, string>()
    if (slugs.length > 0) {
      const { data: devotionals } = await supabaseAdmin
        .from('devotionals')
        .select('slug, title')
        .in('slug', slugs)
      if (devotionals) {
        titleMap = new Map(devotionals.map((d: { slug: string; title: string }) => [d.slug, d.title]))
      }
    }

    const pageviews = coreResults?.[0]?.[0] ?? 0
    const uniqueVisitors = coreResults?.[0]?.[1] ?? 0
    const activeUsers = coreResults?.[0]?.[2] ?? 0

    return NextResponse.json({
      activeUsers,
      pageviews,
      uniqueVisitors,
      topPages: (topPagesRows ?? []).map((r: [string, number]) => ({ page: r[0], views: r[1] })),
      topDevotionals: devotionalRows.map((d: { page: string; views: number }) => {
        const slug = d.page?.match(/\/devotionals\/([^/?#]+)/)?.[1] ?? ''
        return { page: d.page, views: d.views, title: titleMap.get(slug) ?? slug }
      }),
      dailyViews: (last7Rows ?? []).map((r: [string, number]) => ({ day: r[0], views: r[1] })),
      topCountries: (countriesRows ?? []).map((r: [string, string, number]) => ({
        country: r[0],
        countryCode: r[1],
        views: r[2],
      })),
      topCities: (citiesRows ?? []).map((r: [string, string, string, string, number]) => ({
        city: r[0],
        state: r[1],
        countryCode: r[2],
        country: r[3],
        views: r[4],
      })),
      topStates: (statesRows ?? []).map((r: [string, string, number]) => ({
        state: r[0],
        country: r[1],
        views: r[2],
      })),
      lookbackDays: isYesterday ? '24h' : LOOKBACK_DAYS,
    })
  } catch (err) {
    console.error('[analytics] API error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
