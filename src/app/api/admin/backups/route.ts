import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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
    const { blobs } = await list({ prefix: 'backups/' })
    
    // Extract unique dates and their manifests
    const dateMap = new Map<string, { date: string; manifestUrl: string | null }>()
    
    for (const blob of blobs) {
      const match = blob.pathname.match(/^backups\/(\d{4}-\d{2}-\d{2})\//)
      if (match) {
        const date = match[1]
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, manifestUrl: null })
        }
        if (blob.pathname.endsWith('manifest.json')) {
          dateMap.get(date)!.manifestUrl = blob.url
        }
      }
    }

    // Load manifests by fetching the URL directly
    const backups = []
    for (const [date, info] of dateMap) {
      const backupInfo: { date: string; manifest?: unknown } = { date }
      
      if (info.manifestUrl) {
        try {
          const response = await fetch(info.manifestUrl)
          if (response.ok) {
            const text = await response.text()
            backupInfo.manifest = JSON.parse(text)
          }
        } catch (e) {
          console.error(`Error reading manifest for ${date}:`, e)
        }
      }
      
      backups.push(backupInfo)
    }

    // Sort by date descending
    backups.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 })
  }
}
