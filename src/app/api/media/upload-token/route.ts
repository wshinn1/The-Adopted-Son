import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
        tokenPayload: user.id,
      }),
      onUploadCompleted: async ({ blob, tokenPayload: userId }) => {
        await supabaseAdmin.from('media').insert({
          filename: blob.pathname.split('/').pop() ?? blob.pathname,
          pathname: blob.pathname,
          url: blob.url,
          content_type: blob.contentType,
          size_bytes: 0,
          alt_text: '',
          uploaded_by: userId,
        }).throwOnError()
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
