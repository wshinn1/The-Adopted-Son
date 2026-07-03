import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Search text columns (title, excerpt, category) via ilike.
  // content is JSONB so it can't use ilike — handled separately below.
  const { data, error } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, tags')
    .eq('is_published', true)
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,category.ilike.%${q}%`)
    .order('published_at', { ascending: false })
    .limit(12)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const seen = new Set((data || []).map((r: { id: string }) => r.id))

  // Search inside JSONB content by casting to text (phrase/body search).
  const { data: contentMatches } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, tags')
    .eq('is_published', true)
    .filter('content::text', 'ilike', `%${q}%`)
    .order('published_at', { ascending: false })
    .limit(8)

  const contentNew = (contentMatches || []).filter((r: { id: string }) => !seen.has(r.id))
  contentNew.forEach((r: { id: string }) => seen.add(r.id))

  // Tag array match (exact tag, case-sensitive — tags are stored lowercase).
  const { data: tagMatches } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, tags')
    .eq('is_published', true)
    .contains('tags', [q.toLowerCase()])
    .order('published_at', { ascending: false })
    .limit(6)

  const tagNew = (tagMatches || []).filter((r: { id: string }) => !seen.has(r.id))

  const merged = [
    ...(data || []),
    ...contentNew,
    ...tagNew,
  ].slice(0, 12)

  return NextResponse.json({ results: merged })
}
