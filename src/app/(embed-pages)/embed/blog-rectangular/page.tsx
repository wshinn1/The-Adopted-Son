import { createClient } from '@supabase/supabase-js'
import BlogRectangularLayout from '@/components/embed/BlogRectangularLayout'

export const dynamic = 'force-dynamic'

export default async function BlogRectangularEmbed() {
  // Use a stateless anon client — cross-origin iframes don't send session
  // cookies (SameSite=Lax), so the standard server client returns no data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, authors(name, avatar_url)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  return <BlogRectangularLayout posts={data ?? []} />
}
