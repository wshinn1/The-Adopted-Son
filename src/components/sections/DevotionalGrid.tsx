import { supabaseAdmin } from '@/lib/supabase/admin'
import DevotionalGridClient, { type DevotionalGridData, type GridDevo } from './DevotionalGridClient'

interface Props {
  data: DevotionalGridData
}

export default async function DevotionalGrid({ data }: Props) {
  const featuredId = data.featured_devotional_id
  const gridIds: string[] = data.grid_devotional_ids ?? []

  const allIds = [...new Set([...(featuredId ? [featuredId] : []), ...gridIds])]

  let featured: GridDevo | null = null
  let gridPosts: GridDevo[] = []

  if (allIds.length > 0) {
    const { data: rows } = await supabaseAdmin
      .from('devotionals')
      .select('id, title, slug, excerpt, cover_image_url, published_at, category')
      .in('id', allIds)
      .eq('is_published', true)

    const map = new Map((rows ?? []).map((d: GridDevo) => [d.id, d]))
    if (featuredId && map.has(featuredId)) featured = map.get(featuredId)!
    gridPosts = gridIds.flatMap(id => (map.has(id) ? [map.get(id)!] : []))
  }

  return <DevotionalGridClient data={data} featured={featured} gridPosts={gridPosts} />
}
