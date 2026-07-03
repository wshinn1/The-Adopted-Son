import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const { data, error } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, tags')
    .eq('is_published', true)
    .or(
      `title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%,category.ilike.%${q}%`
    )
    .order('published_at', { ascending: false })
    .limit(12)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also surface results that match a tag (array overlap can't be done in .or(), so merge)
  const { data: tagMatches } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, tags')
    .eq('is_published', true)
    .contains('tags', [q])
    .order('published_at', { ascending: false })
    .limit(6)

  const seen = new Set((data || []).map((r) => r.id))
  const merged = [
    ...(data || []),
    ...(tagMatches || []).filter((r) => !seen.has(r.id)),
  ].slice(0, 12)

  return NextResponse.json({ results: merged })
}
