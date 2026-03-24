import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { put, list, del } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'weshinn@gmail.com'
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '341992'
const POSTHOG_API_URL = 'https://us.posthog.com'

export const maxDuration = 300 // 5 minutes max

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

async function performBackup() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Missing Supabase config' }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const timestamp = new Date().toISOString().split('T')[0]
    const backupFolder = `backups/${timestamp}`

    const tables = [
      'profiles',
      'devotionals',
      'pages',
      'page_sections',
      'section_templates',
      'site_settings',
      'media',
      'subscription_plans',
      'visitor_trials',
      'admin_logs',
    ]

    const backupResults: Record<string, { rows: number; success: boolean }> = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*')
        
        if (error) {
          backupResults[table] = { rows: 0, success: false }
          continue
        }

        const jsonData = JSON.stringify(data, null, 2)
        
        await put(`${backupFolder}/database/${table}.json`, jsonData, {
          access: 'public',
          contentType: 'application/json',
        })

        backupResults[table] = { rows: data?.length || 0, success: true }
      } catch {
        backupResults[table] = { rows: 0, success: false }
      }
    }

    // Backup media files
    const { data: mediaRecords } = await supabase
      .from('media')
      .select('url, pathname, filename')

    let mediaBackedUp = 0
    if (mediaRecords && mediaRecords.length > 0) {
      for (const media of mediaRecords) {
        try {
          if (media.url) {
            const response = await fetch(media.url)
            if (response.ok) {
              const blob = await response.blob()
              await put(
                `${backupFolder}/media/${media.pathname || media.filename}`,
                blob,
                { access: 'public' }
              )
              mediaBackedUp++
            }
          }
        } catch {
          // Skip failed media
        }
      }
    }

    // Create manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      tables: backupResults,
      mediaFiles: mediaBackedUp,
      totalMediaRecords: mediaRecords?.length || 0,
    }

    await put(`${backupFolder}/manifest.json`, JSON.stringify(manifest, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })

    // Cleanup old backups (keep 30 days)
    try {
      const { blobs } = await list({ prefix: 'backups/' })
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)

      const datefolders = new Set<string>()
      for (const blob of blobs) {
        const match = blob.pathname.match(/^backups\/(\d{4}-\d{2}-\d{2})\//)
        if (match) datefolders.add(match[1])
      }

      for (const dateStr of datefolders) {
        const folderDate = new Date(dateStr)
        if (folderDate < cutoffDate) {
          const folderBlobs = blobs.filter(b => b.pathname.startsWith(`backups/${dateStr}/`))
          for (const blob of folderBlobs) {
            await del(blob.url)
          }
        }
      }
    } catch {
      // Cleanup errors are non-fatal
    }

    return { success: true, manifest }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run backup first
    const backupResult = await performBackup()

    // Fetch analytics for yesterday
    const [visitorsRows, pageviewRows, topPagesRows, countriesRows, citiesRows, devotionalsRows] = await Promise.all([
      runQuery(`
        SELECT count(DISTINCT distinct_id) as visitors
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
      `),
      runQuery(`
        SELECT count() as pageviews
        FROM events
        WHERE lower(event) = '$pageview'
          AND toDate(timestamp) = today() - 1
      `),
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

    // Build backup summary
    const backupSummary = backupResult.success && backupResult.manifest
      ? {
          tablesBackedUp: Object.entries(backupResult.manifest.tables)
            .filter(([_, v]) => v.success)
            .map(([name, v]) => `${name}: ${v.rows} rows`),
          failedTables: Object.entries(backupResult.manifest.tables)
            .filter(([_, v]) => !v.success)
            .map(([name]) => name),
          mediaFiles: backupResult.manifest.mediaFiles,
          totalMedia: backupResult.manifest.totalMediaRecords,
        }
      : null

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
    <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Daily Report</h1>
    <p style="font-size: 14px; color: #666; margin: 0 0 32px 0;">${dateStr}</p>
    
    <!-- Backup Status -->
    <div style="background: ${backupResult.success ? '#f0fdf4' : '#fef2f2'}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: ${backupResult.success ? '#16a34a' : '#dc2626'};">
        ${backupResult.success ? 'Backup Complete' : 'Backup Failed'}
      </h2>
      ${backupSummary ? `
        <p style="font-size: 13px; color: #666; margin: 0;">
          ${backupSummary.tablesBackedUp.length} tables backed up | ${backupSummary.mediaFiles}/${backupSummary.totalMedia} media files
        </p>
        ${backupSummary.failedTables.length > 0 ? `
          <p style="font-size: 13px; color: #dc2626; margin: 8px 0 0 0;">
            Failed: ${backupSummary.failedTables.join(', ')}
          </p>
        ` : ''}
      ` : `
        <p style="font-size: 13px; color: #666; margin: 0;">${backupResult.error || 'Unknown error'}</p>
      `}
    </div>
    
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
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Countries</h2>
      ${countries.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse;">
        ${countries.map((c: { country: string; views: number }, i: number) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px;">${i + 1}. ${c.country}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${c.views}</td>
          </tr>
        `).join('')}
      </table>
      ` : `<p style="font-size: 13px; color: #9ca3af; margin: 0;">No geographic data for yesterday</p>`}
    </div>
    
    <!-- Cities -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Cities</h2>
      ${cities.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse;">
        ${cities.map((c: { city: string; views: number }, i: number) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-size: 14px;">${i + 1}. ${c.city}</td>
            <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: 500;">${c.views}</td>
          </tr>
        `).join('')}
      </table>
      ` : `<p style="font-size: 13px; color: #9ca3af; margin: 0;">No city data for yesterday</p>`}
    </div>
    
    <!-- Top Pages -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Pages</h2>
      ${topPages.length > 0 ? `
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
      ` : `<p style="font-size: 13px; color: #9ca3af; margin: 0;">No page views yesterday</p>`}
    </div>
    
    <!-- Top Devotionals -->
    <div style="margin-bottom: 16px;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Devotionals</h2>
      ${devotionals.length > 0 ? `
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
      ` : `<p style="font-size: 13px; color: #9ca3af; margin: 0;">No devotional views yesterday</p>`}
    </div>
    
    <p style="font-size: 12px; color: #999; margin: 32px 0 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <a href="https://www.theadoptedson.com/admin/analytics" style="color: #2563eb;">View analytics</a> | 
      <a href="https://www.theadoptedson.com/admin/backups" style="color: #2563eb;">View backups</a>
    </p>
  </div>
</body>
</html>
    `

    // Send email
    await resend.emails.send({
      from: 'The Adopted Son <noreply@theadoptedson.com>',
      to: ADMIN_EMAIL,
      subject: `Daily Report: ${visitors} visitors, ${pageviews} pageviews | Backup ${backupResult.success ? 'OK' : 'FAILED'} — ${dateStr}`,
      html,
    })

    return NextResponse.json({ success: true, visitors, pageviews, backup: backupResult.success })
  } catch (error) {
    console.error('Failed to send daily report:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
