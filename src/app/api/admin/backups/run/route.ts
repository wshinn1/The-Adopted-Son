import { put, list, del } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const maxDuration = 300

export async function POST() {
  // Check admin auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Use service role for full access
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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
        const { data, error } = await serviceSupabase.from(table).select('*')
        
        if (error) {
          backupResults[table] = { rows: 0, success: false }
          continue
        }

        await put(`${backupFolder}/database/${table}.json`, JSON.stringify(data, null, 2), {
          access: 'private',
          contentType: 'application/json',
        })

        backupResults[table] = { rows: data?.length || 0, success: true }
      } catch {
        backupResults[table] = { rows: 0, success: false }
      }
    }

    // Backup media
    const { data: mediaRecords } = await serviceSupabase
      .from('media')
      .select('url, pathname, filename')

    let mediaBackedUp = 0
    if (mediaRecords?.length) {
      for (const media of mediaRecords) {
        try {
          if (media.url) {
            const response = await fetch(media.url)
            if (response.ok) {
              const blob = await response.blob()
              await put(
                `${backupFolder}/media/${media.pathname || media.filename}`,
                blob,
                { access: 'private' }
              )
              mediaBackedUp++
            }
          }
        } catch {
          // Skip failed media
        }
      }
    }

    const manifest = {
      timestamp: new Date().toISOString(),
      tables: backupResults,
      mediaFiles: mediaBackedUp,
      totalMediaRecords: mediaRecords?.length || 0,
    }

    await put(`${backupFolder}/manifest.json`, JSON.stringify(manifest, null, 2), {
      access: 'private',
      contentType: 'application/json',
    })

    return NextResponse.json({ success: true, backup: manifest })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 })
  }
}
