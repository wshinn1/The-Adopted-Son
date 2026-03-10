import { createClient } from '@/lib/supabase/server'
import { devotionalToPost, Devotional } from '@/lib/devotional-mapper'
import DevotionalCard from '@/components/devotional/DevotionalCard'
import Link from 'next/link'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: devotionals } = await supabase
    .from('devotionals')
    .select(`
      *,
      author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(8)

  const posts = ((devotionals as Devotional[]) ?? []).map(devotionalToPost)

  return (
    <div className="space-y-10">
      {/* WELCOME */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Continue your spiritual journey with today's devotionals.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/devotionals"
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Browse Devotionals
          </Link>
          <Link
            href="/account/billing"
            className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Manage Subscription
          </Link>
        </div>
      </div>

      {/* RECENT DEVOTIONALS */}
      {posts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Recent Devotionals
            </h2>
            <Link
              href="/devotionals"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <DevotionalCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
