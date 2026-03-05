import { ApplicationLayout } from '@/app/(app)/application-layout'
import DevotionalGrid from '@/components/devotional/DevotionalGrid'
import TrialBanner from '@/components/devotional/TrialBanner'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Devotionals — The Adopted Son',
  description: 'Browse all daily devotionals from The Adopted Son.',
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>
}

const PAGE_SIZE = 12

export default async function DevotionalsPage({ searchParams }: Props) {
  const { page, category } = await searchParams
  const currentPage = parseInt(page ?? '1', 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, scripture_reference, category, tags, read_time_minutes, published_at, is_premium', { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: devotionals, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Get unique categories for filter
  const { data: categories } = await supabase
    .from('devotionals')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)

  const uniqueCategories = [...new Set(categories?.map((d) => d.category).filter(Boolean))]

  return (
    <ApplicationLayout headerStyle="header-2">
      <TrialBanner />
      <main className="container py-16 lg:py-24">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 text-balance">
            All Devotionals
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            {count ?? 0} devotionals to grow your faith
          </p>
        </div>

        {/* Category filter */}
        {uniqueCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <a
              href="/devotionals"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !category
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              All
            </a>
            {uniqueCategories.map((cat) => (
              <a
                key={cat}
                href={`/devotionals?category=${encodeURIComponent(cat!)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {cat}
              </a>
            ))}
          </div>
        )}

        <DevotionalGrid devotionals={devotionals ?? []} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {currentPage > 1 && (
              <a
                href={`/devotionals?page=${currentPage - 1}${category ? `&category=${category}` : ''}`}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Previous
              </a>
            )}
            <span className="text-sm text-neutral-500">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <a
                href={`/devotionals?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Next
              </a>
            )}
          </div>
        )}
      </main>
    </ApplicationLayout>
  )
}
