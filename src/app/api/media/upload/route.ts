import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

// Allow larger file uploads (up to 50MB)
export const config = {
  api: {
    bodyParser: false,
  },
}

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const altText = formData.get('altText') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const blob = await put(`media/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  // Save to media table - column names must match schema
  const { data: mediaRecord, error } = await supabase
    .from('media')
    .insert({
      filename: file.name,
      original_name: file.name,
      blob_pathname: blob.pathname,
      blob_url: blob.url,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText ?? '',
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ media: mediaRecord, url: blob.url })
}
