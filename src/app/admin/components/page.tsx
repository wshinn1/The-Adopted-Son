import { createClient } from '@/lib/supabase/server'
import BlogRectangularLayout from '@/components/embed/BlogRectangularLayout'
import { CopyButton } from '@/components/admin/CopyButton'

export default async function ComponentsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, authors(name, avatar_url)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const posts = data ?? []
  const embedUrl = 'https://theadoptedson.com/embed/blog-rectangular'
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="420" frameborder="0" style="border-radius:8px;overflow:hidden;" loading="lazy"></iframe>`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">Admin</p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Components</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Embeddable components you can place on external sites via iframe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">

          {/* Browser chrome bar */}
          <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-3 py-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-xs text-neutral-400 ml-2 truncate">{embedUrl}</span>
          </div>

          {/* Live scaled preview */}
          <div className="relative h-52 overflow-hidden bg-white">
            <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', pointerEvents: 'none' }}>
              <BlogRectangularLayout posts={posts} />
            </div>
          </div>

          {/* Info + copy */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Blog Rectangular Layout</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Shows the 3 latest devotionals in a clean rectangular list with image, category, title, excerpt, and author.</p>
            <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 flex items-center gap-2">
              <code className="text-xs text-neutral-600 dark:text-neutral-400 flex-1 truncate">{iframeCode}</code>
              <CopyButton text={iframeCode} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
