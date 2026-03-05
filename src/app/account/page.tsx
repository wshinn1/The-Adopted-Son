import { createClient } from '@/lib/supabase/server'
import DevotionalGrid from '@/components/devotional/DevotionalGrid'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: devotionals } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, scripture_reference, category, tags, read_time_minutes, published_at, is_premium')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(12)

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        Your Devotionals
      </h1>
      <DevotionalGrid devotionals={devotionals ?? []} />
    </div>
  )
}
