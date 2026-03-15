import { put, list, del } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// This route is called by Vercel Cron at midnight every day
// It backs up all database tables and media to Vercel Blob

export const maxDuration = 300 // 5 minutes max for backup

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Backup cron: Unauthorized - invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Backup cron: Missing Supabase environment variables')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    // Initialize Supabase with service role for full access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const backupFolder = `backups/${timestamp}`

    // Tables to backup
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

    // Backup each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*')
        
        if (error) {
          console.error(`Error fetching ${table}:`, error)
          backupResults[table] = { rows: 0, success: false }
          continue
        }

        const jsonData = JSON.stringify(data, null, 2)
        
        await put(`${backupFolder}/database/${table}.json`, jsonData, {
          access: 'public',
          contentType: 'application/json',
        })

        backupResults[table] = { rows: data?.length || 0, success: true }
      } catch (err) {
        console.error(`Error backing up ${table}:`, err)
        backupResults[table] = { rows: 0, success: false }
      }
    }

    // Backup media files
    // First get list of media from database
    const { data: mediaRecords } = await supabase
      .from('media')
      .select('url, pathname, filename')

    let mediaBackedUp = 0
    if (mediaRecords && mediaRecords.length > 0) {
      for (const media of mediaRecords) {
        try {
          if (media.url) {
            // Fetch the media file
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
        } catch (err) {
          console.error(`Error backing up media ${media.filename}:`, err)
        }
      }
    }

    // Create a manifest file with backup info
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

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups(30)

    // Send email notification
    await sendBackupEmail(manifest)

    return NextResponse.json({
      success: true,
      backup: manifest,
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json(
      { error: 'Backup failed', details: String(error) },
      { status: 500 }
    )
  }
}

async function sendBackupEmail(manifest: {
  timestamp: string
  tables: Record<string, { rows: number; success: boolean }>
  mediaFiles: number
  totalMediaRecords: number
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.log('No ADMIN_EMAIL set, skipping backup notification')
    return
  }

  const successfulTables = Object.entries(manifest.tables)
    .filter(([_, v]) => v.success)
    .map(([name, v]) => `${name}: ${v.rows} rows`)
  
  const failedTables = Object.entries(manifest.tables)
    .filter(([_, v]) => !v.success)
    .map(([name]) => name)

  const date = new Date(manifest.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  try {
    await resend.emails.send({
      from: 'The Adopted Son <noreply@theadoptedson.com>',
      to: adminEmail,
      subject: `Backup Complete - ${date}`,
      html: `
        <h2>Daily Backup Complete</h2>
        <p><strong>Date:</strong> ${date}</p>
        
        <h3>Database Tables Backed Up:</h3>
        <ul>
          ${successfulTables.map(t => `<li>${t}</li>`).join('')}
        </ul>
        
        ${failedTables.length > 0 ? `
          <h3 style="color: red;">Failed Tables:</h3>
          <ul>
            ${failedTables.map(t => `<li>${t}</li>`).join('')}
          </ul>
        ` : ''}
        
        <h3>Media Files:</h3>
        <p>${manifest.mediaFiles} of ${manifest.totalMediaRecords} files backed up</p>
        
        <p style="margin-top: 20px; color: #666;">
          View and download backups at <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/backups">/admin/backups</a>
        </p>
      `,
    })
    console.log('Backup notification email sent')
  } catch (error) {
    console.error('Failed to send backup email:', error)
  }
}

async function cleanupOldBackups(keepDays: number) {
  try {
    const { blobs } = await list({ prefix: 'backups/' })
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepDays)

    // Group blobs by date folder
    const datefolders = new Set<string>()
    for (const blob of blobs) {
      const match = blob.pathname.match(/^backups\/(\d{4}-\d{2}-\d{2})\//)
      if (match) {
        datefolders.add(match[1])
      }
    }

    // Delete folders older than cutoff
    for (const dateStr of datefolders) {
      const folderDate = new Date(dateStr)
      if (folderDate < cutoffDate) {
        // Find all blobs in this folder and delete them
        const folderBlobs = blobs.filter(b => b.pathname.startsWith(`backups/${dateStr}/`))
        for (const blob of folderBlobs) {
          await del(blob.url)
        }
        console.log(`Deleted old backup: ${dateStr}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error)
  }
}
