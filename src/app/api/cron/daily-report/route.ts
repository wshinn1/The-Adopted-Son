import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'weshinn@gmail.com'
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

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch analytics for yesterday
    const [visitorsRows, pageviewRows, topPagesRows, countriesRows, citiesRows, devotionalsRows] = await Promise.all([
      // Unique visitors yesterday
      runQuery(`
        SELECT count(DISTINCT distinct_id) as visitors
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
      `),
      // Total pageviews yesterday
      runQuery(`
        SELECT count() as pageviews
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
      `),
      // Top 10 pages yesterday
      runQuery(`
        SELECT 
          properties['$current_url'] as page, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
      // Top countries yesterday
      runQuery(`
        SELECT 
          coalesce(
            properties['$geoip_country_name'],
            properties['$geoip_country_code'],
            properties['$country_code'],
            properties['$country']
          ) as country, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
          AND country IS NOT NULL
          AND country != ''
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `),
      // Top cities yesterday
      runQuery(`
        SELECT 
          coalesce(
            properties['$geoip_city_name'],
            properties['$geoip_city'],
            properties['$city']
          ) as city, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
          AND city IS NOT NULL
          AND city != ''
        GROUP BY city
        ORDER BY views DESC
        LIMIT 10
      `),
      // Top devotionals yesterday
      runQuery(`
        SELECT 
          properties['$current_url'] as page, 
          count() as views
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
          AND properties['$current_url'] LIKE '%/devotionals/%'
        GROUP BY page
        ORDER BY views DESC
        LIMIT 10
      `),
    ])

    const visitors = visitorsRows[0]?.[0] ?? 0
    const pageviews = pageviewRows[0]?.[0] ?? 0
    const topPages = topPagesRows.map((r: [string, number]) => ({ page: r[0], views: r[1] }))
    const countries = countriesRows.map((r: [string, number]) => ({ country: r[0], views: r[1] }))
    const cities = citiesRows.map((r: [string, number]) => ({ city: r[0], views: r[1] }))
    const devotionals = devotionalsRows.map((r: [string, number]) => ({ page: r[0], views: r[1] }))

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Daily Analytics Report</h1>
    <p style="font-size: 14px; color: #666; margin: 0 0 32px 0;">${dateStr}</p>
    
    <!-- Key Metrics -->
    <div style="display: flex; gap: 16px; margin-bottom: 32px;">
      <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="font-size: 32px; font-weight: 700; margin: 0; color: #16a34a;">${visitors}</p>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0 0; text-transform: uppercase;">Visitors</p>
      </div>
      <div style="flex: 1; background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="font-size: 32px; font-weight: 700; margin: 0; color: #2563eb;">${pageviews}</p>
        <p style="font-size: 12px; color: #666; margin: 4px 0 0 0; text-transform: uppercase;">Pageviews</p>
      </div>
    </div>
    
    <!-- Countries -->
    ${countries.length > 0 ? `
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Countries</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${countries.map((c: { country: string; views: number }, i: number) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px;">${i + 1}. ${c.country}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${c.views}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
    
    <!-- Cities -->
    ${cities.length > 0 ? `
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Cities</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${cities.map((c: { city: string; views: number }, i: number) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px;">${i + 1}. ${c.city}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${c.views}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
    
    <!-- Top Pages -->
    ${topPages.length > 0 ? `
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Pages</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${topPages.slice(0, 10).map((p: { page: string; views: number }, i: number) => {
          const shortUrl = p.page?.replace('https://www.theadoptedson.com', '').replace('https://theadoptedson.com', '') || '/'
          return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${i + 1}. ${shortUrl}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${p.views}</td>
          </tr>
        `}).join('')}
      </table>
    </div>
    ` : ''}
    
    <!-- Top Devotionals -->
    ${devotionals.length > 0 ? `
    <div style="margin-bottom: 16px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Devotionals</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${devotionals.slice(0, 10).map((d: { page: string; views: number }, i: number) => {
          const slug = d.page?.split('/devotionals/')[1]?.split('?')[0] || d.page
          return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${i + 1}. ${slug}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${d.views}</td>
          </tr>
        `}).join('')}
      </table>
    </div>
    ` : ''}
    
    <p style="font-size: 12px; color: #999; margin: 32px 0 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <a href="https://www.theadoptedson.com/admin/analytics" style="color: #2563eb;">View full analytics dashboard</a>
    </p>
  </div>
</body>
</html>
    `

    // Send email
    await resend.emails.send({
      from: 'The Adopted Son <noreply@theadoptedson.com>',
      to: ADMIN_EMAIL,
      subject: `Daily Report: ${visitors} visitors, ${pageviews} pageviews — ${dateStr}`,
      html,
    })

    return NextResponse.json({ success: true, visitors, pageviews })
  } catch (error) {
    console.error('Failed to send daily report:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
