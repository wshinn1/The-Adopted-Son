import { NextResponse } from 'next/server'

// PostHog Project ID - get from PostHog dashboard > Project Settings
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '341992'
// Note: API endpoint is us.posthog.com (not us.i.posthog.com which is for client tracking)
const POSTHOG_API_URL = 'https://us.posthog.com'

// Use 7 days instead of 30 to reduce query load and avoid timeouts
const LOOKBACK_DAYS = 7

async function runQuery(query: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) {
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
      return []
    }
    
    const json = await res.json()
    return json.results ?? []
  } catch {
    return []
  }
}

// Helper to run queries sequentially to avoid concurrency limits
async function runQueriesSequentially<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = []
  for (const query of queries) {
    results.push(await query())
  }
  return results
}

export async function GET() {
  try {
    // Run queries in batches of 2 to stay under PostHog's concurrency limit of 3
    // Batch 1: Core metrics
    const [coreResults] = await Promise.all([
      runQuery(`
        SELECT 
          count() as pageviews,
          count(DISTINCT distinct_id) as uniques,
          countIf(timestamp >= now() - INTERVAL 5 MINUTE) as active_recent
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY
      `),
    ])
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100))
    
    // Batch 2: Top pages and daily views (run in parallel, max 2)
    const [topPagesRows, last7Rows] = await Promise.all([
      runQuery(`
        SELECT 
          properties['$current_url'] as page, 
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY
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
          AND timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY
        GROUP BY day
        ORDER BY day ASC
      `),
    ])
    
    await new Promise(r => setTimeout(r, 100))
    
    // Batch 3: Geo data (run in parallel, max 2)
    // PostHog stores geo data with $geoip_ prefix on event properties
    const [countriesRows, citiesRows] = await Promise.all([
      runQuery(`
        SELECT 
          properties.$geoip_country_name as country, 
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY
          AND properties.$geoip_country_name IS NOT NULL
          AND properties.$geoip_country_name != ''
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `),
      runQuery(`
        SELECT 
          properties.$geoip_city_name as city, 
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL ${LOOKBACK_DAYS} DAY
          AND properties.$geoip_city_name IS NOT NULL
          AND properties.$geoip_city_name != ''
        GROUP BY city
        ORDER BY views DESC
        LIMIT 10
      `),
    ])

    const pageviews = coreResults?.[0]?.[0] ?? 0
    const uniqueVisitors = coreResults?.[0]?.[1] ?? 0
    const activeUsers = coreResults?.[0]?.[2] ?? 0

    return NextResponse.json({
      activeUsers,
      pageviews,
      uniqueVisitors,
      topPages: (topPagesRows ?? []).map((r: [string, number]) => ({ page: r[0], views: r[1] })),
      dailyViews: (last7Rows ?? []).map((r: [string, number]) => ({ day: r[0], views: r[1] })),
      countries: (countriesRows ?? []).map((r: [string, number]) => ({ country: r[0], views: r[1] })),
      cities: (citiesRows ?? []).map((r: [string, number]) => ({ city: r[0], views: r[1] })),
      lookbackDays: LOOKBACK_DAYS,
    })
  } catch (err) {
    console.error('[v0] Analytics API error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
