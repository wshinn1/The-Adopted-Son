import { createClient } from '@supabase/supabase-js'
import BlogRectangularLayout from '@/components/embed/BlogRectangularLayout'

export const dynamic = 'force-dynamic'

export default async function BlogRectangularEmbed() {
  // Service role client bypasses RLS — safe for server-side only use
  // Standard session cookies are not available in cross-origin iframe requests
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, authors(name, avatar_url)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  return <BlogRectangularLayout posts={data ?? []} />
}
