import { list, get } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import JSZip from 'jszip'

export const maxDuration = 300

export async function GET(request: NextRequest) {
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

  const date = request.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })
  }

  try {
    const { blobs } = await list({ prefix: `backups/${date}/` })
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    const zip = new JSZip()

    for (const blob of blobs) {
      try {
        // Extract relative path
        const relativePath = blob.pathname.replace(`backups/${date}/`, '')
        
        const result = await get(blob.pathname, { access: 'private' })
        if (result) {
          const buffer = await new Response(result.stream).arrayBuffer()
          zip.file(relativePath, buffer)
        }
      } catch (e) {
        console.error(`Error adding ${blob.pathname} to zip:`, e)
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="backup-${date}.zip"`,
      },
    })
  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 })
  }
}
