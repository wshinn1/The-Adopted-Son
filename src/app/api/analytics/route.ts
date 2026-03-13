import { NextResponse } from 'next/server'

const PROJECT_ID = '341992'
const POSTHOG_URL = 'https://us.posthog.com'

async function runQuery(query: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) {
    console.error('[v0] POSTHOG_PERSONAL_API_KEY is not set')
    return []
  }
  
  const res = await fetch(`${POSTHOG_URL}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    cache: 'no-store', // always fetch fresh for real-time data
  })
  
  if (!res.ok) {
    const text = await res.text()
    console.error('[v0] PostHog query failed:', res.status, text)
    throw new Error(`PostHog query failed: ${res.status}`)
  }
  
  const json = await res.json()
  console.log('[v0] PostHog query result:', JSON.stringify(json).slice(0, 500))
  return json.results ?? []
}

export async function GET() {
  try {
    const [pageviewRows, uniqueRows, topPagesRows, last30Rows, countriesRows, citiesRows] = await Promise.all([
      // Total pageviews last 30 days
      runQuery(`
        SELECT count() as total
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
      `),
      // Unique visitors last 30 days
      runQuery(`
        SELECT count(distinct distinct_id) as uniques
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
      `),
      // Top 10 pages last 30 days
      runQuery(`
        SELECT properties.$pathname as page, count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
      // Pageviews per day last 7 days
      runQuery(`
        SELECT toDate(timestamp) as day, count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 7 day
        GROUP BY day
        ORDER BY day ASC
      `),
      // Top countries last 30 days
      runQuery(`
        SELECT properties.$geoip_country_name as country, count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
          AND properties.$geoip_country_name IS NOT NULL
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `),
      // Top cities (with state/country) last 30 days
      runQuery(`
        SELECT 
          properties.$geoip_city_name as city,
          properties.$geoip_subdivision_1_name as state,
          properties.$geoip_country_code as country_code,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
          AND properties.$geoip_city_name IS NOT NULL
        GROUP BY city, state, country_code
        ORDER BY views DESC
        LIMIT 10
      `),
    ])

    return NextResponse.json({
      pageviews: pageviewRows?.[0]?.[0] ?? 0,
      uniqueVisitors: uniqueRows?.[0]?.[0] ?? 0,
      topPages: topPagesRows?.map((r: [string, number]) => ({ page: r[0], views: r[1] })) ?? [],
      dailyViews: last30Rows?.map((r: [string, number]) => ({ day: r[0], views: r[1] })) ?? [],
      topCountries: countriesRows?.map((r: [string, number]) => ({ country: r[0], views: r[1] })) ?? [],
      topCities: citiesRows?.map((r: [string, string, string, number]) => ({ 
        city: r[0], 
        state: r[1], 
        countryCode: r[2], 
        views: r[3] 
      })) ?? [],
    })
  } catch (e) {
    console.error('[v0] PostHog API error:', e)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
