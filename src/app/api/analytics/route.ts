import { NextResponse } from 'next/server'

const PROJECT_ID = '341992'
const POSTHOG_URL = 'https://us.posthog.com'

async function runQuery(query: string) {
  const res = await fetch(`${POSTHOG_URL}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    next: { revalidate: 300 }, // cache 5 mins
  })
  if (!res.ok) throw new Error(`PostHog query failed: ${res.status}`)
  const json = await res.json()
  return json.results ?? []
}

export async function GET() {
  try {
    const [pageviewRows, uniqueRows, topPagesRows, last30Rows] = await Promise.all([
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
      // Top 5 pages last 30 days
      runQuery(`
        SELECT properties.$pathname as page, count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval 30 day
        GROUP BY page
        ORDER BY views DESC
        LIMIT 5
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
    ])

    return NextResponse.json({
      pageviews: pageviewRows?.[0]?.[0] ?? 0,
      uniqueVisitors: uniqueRows?.[0]?.[0] ?? 0,
      topPages: topPagesRows?.map((r: [string, number]) => ({ page: r[0], views: r[1] })) ?? [],
      dailyViews: last30Rows?.map((r: [string, number]) => ({ day: r[0], views: r[1] })) ?? [],
    })
  } catch (e) {
    console.error('[v0] PostHog API error:', e)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
