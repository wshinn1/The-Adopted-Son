import { NextResponse } from 'next/server'

// PostHog Project ID - get from PostHog dashboard > Project Settings
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '341992'
// Note: API endpoint is us.posthog.com (not us.i.posthog.com which is for client tracking)
const POSTHOG_API_URL = 'https://us.posthog.com'

// Fetch active users in the last 5 minutes (more real-time)
async function getActiveUsers() {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) return 0
  
  try {
    const res = await fetch(`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: `
            SELECT count(DISTINCT distinct_id) as active
            FROM events
            WHERE timestamp >= now() - INTERVAL 5 MINUTE
          `
        }
      }),
      cache: 'no-store',
    })
    
    if (!res.ok) return 0
    const json = await res.json()
    return json.results?.[0]?.[0] ?? 0
  } catch {
    return 0
  }
}

async function runQuery(query: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) {
    console.error('[v0] POSTHOG_PERSONAL_API_KEY is not set')
    return []
  }
  
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
    
    if (!res.ok) {
      const text = await res.text()
      console.error('[v0] PostHog query failed:', res.status, text)
      return []
    }
    
    const json = await res.json()
    return json.results ?? []
  } catch (err) {
    console.error('[v0] PostHog fetch error:', err)
    return []
  }
}

export async function GET() {
  try {
    const [activeUsers, pageviewRows, uniqueRows, topPagesRows, last30Rows, countriesRows, citiesRows] = await Promise.all([
      getActiveUsers(),
      // Total pageviews last 30 days - use lowercase comparison for event name
      runQuery(`
        SELECT count() as total
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
      `),
      // Unique visitors last 30 days
      runQuery(`
        SELECT count(DISTINCT distinct_id) as uniques
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
      `),
      // Top 10 pages last 30 days
      runQuery(`
        SELECT 
          properties['$current_url'] as page, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
      // Daily views last 30 days
      runQuery(`
        SELECT 
          toDate(timestamp) as day, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day ASC
      `),
      // Top countries
      runQuery(`
        SELECT 
          properties['$geoip_country_name'] as country, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties['$geoip_country_name'] IS NOT NULL
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `),
      // Top cities
      runQuery(`
        SELECT 
          properties['$geoip_city_name'] as city, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties['$geoip_city_name'] IS NOT NULL
        GROUP BY city
        ORDER BY views DESC
        LIMIT 10
      `),
    ])

    return NextResponse.json({
      activeUsers,
      pageviews: pageviewRows?.[0]?.[0] ?? 0,
      uniqueVisitors: uniqueRows?.[0]?.[0] ?? 0,
      topPages: (topPagesRows ?? []).map((r: [string, number]) => ({ page: r[0], views: r[1] })),
      dailyViews: (last30Rows ?? []).map((r: [string, number]) => ({ day: r[0], views: r[1] })),
      countries: (countriesRows ?? []).map((r: [string, number]) => ({ country: r[0], views: r[1] })),
      cities: (citiesRows ?? []).map((r: [string, number]) => ({ city: r[0], views: r[1] })),
    })
  } catch (err) {
    console.error('[v0] Analytics API error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
