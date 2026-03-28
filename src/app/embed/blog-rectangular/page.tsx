import { createClient } from '@/lib/supabase/server'
import BlogRectangularLayout from '@/components/embed/BlogRectangularLayout'

export const revalidate = 300

export default async function BlogRectangularEmbed() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, authors(name, avatar_url)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: system-ui, -apple-system, sans-serif; background: white; } a { text-decoration: none; color: inherit; }`}</style>
      </head>
      <body>
        <BlogRectangularLayout posts={data ?? []} />
      </body>
    </html>
  )
}
