import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '4'), 12)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devotionals')
    .select(`
      id, title, slug, excerpt, cover_image_url, published_at,
      devotional_categories (
        categories ( name )
      )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devotionals: data })
}
