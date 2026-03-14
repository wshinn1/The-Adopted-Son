import { NextResponse } from 'next/server'

const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '341992'
const POSTHOG_API_URL = 'https://us.posthog.com'

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

export async function GET() {
  try {
    // Get real-time visitors (last 5 minutes) with their approximate location
    const realtimeVisitors = await runQuery(`
      SELECT 
        distinct_id,
        properties['$geoip_country_name'] as country,
        properties['$geoip_country_code'] as countryCode,
        properties['$geoip_city_name'] as city,
        properties['$geoip_latitude'] as lat,
        properties['$geoip_longitude'] as lng,
        max(timestamp) as lastSeen
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - INTERVAL 5 MINUTE
      GROUP BY distinct_id, country, countryCode, city, lat, lng
      ORDER BY lastSeen DESC
      LIMIT 50
    `)

    const visitors = (realtimeVisitors ?? []).map((r: [string, string, string, string, number, number, string]) => ({
      id: r[0],
      country: r[1] || 'Unknown',
      countryCode: r[2] || '',
      city: r[3] || '',
      lat: r[4] || 0,
      lng: r[5] || 0,
      lastSeen: r[6],
    }))

    return NextResponse.json({
      visitors,
      count: visitors.length,
    })
  } catch (err) {
    console.error('[v0] Realtime analytics API error:', err)
    return NextResponse.json({ error: 'Failed to fetch realtime data' }, { status: 500 })
  }
}
