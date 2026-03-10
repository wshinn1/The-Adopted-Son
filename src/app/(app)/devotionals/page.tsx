import SectionGridPosts from '@/components/SectionGridPosts'
import TrialBanner from '@/components/devotional/TrialBanner'
import { devotionalToPost, getDevotionals, Devotional } from '@/lib/devotional-mapper'
import { createClient } from '@/lib/supabase/server'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import HeadingWithSub from '@/shared/Heading'
import { Metadata } from 'next'
import Link from 'next/link'

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

  // Build query
  let query = supabase
    .from('devotionals')
    .select(`
      *,
      author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: devotionals, count } = await query as { data: Devotional[] | null; count: number | null }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Convert to template post format
  const posts = (devotionals ?? []).map(devotionalToPost)

  // Get unique categories for filter
  const { data: categories } = await supabase
    .from('devotionals')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)

  const uniqueCategories = [...new Set(categories?.map((d) => d.category).filter(Boolean))]

  return (
    <div className="relative">
      {/* TRIAL BANNER */}
      <TrialBanner />
      
      <div className="container py-16 lg:py-24">
        {/* HEADER */}
        <div className="mb-12">
          <HeadingWithSub subHeading={`${count ?? 0} devotionals to grow your faith`}>
            All Devotionals
          </HeadingWithSub>
        </div>

        {/* CATEGORY FILTER */}
        {uniqueCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            <Link href="/devotionals">
              <ButtonPrimary className={!category ? '' : 'opacity-60'}>
                All
              </ButtonPrimary>
            </Link>
            {uniqueCategories.map((cat) => (
              <Link key={cat} href={`/devotionals?category=${encodeURIComponent(cat!)}`}>
                <ButtonSecondary className={category === cat ? 'ring-2 ring-primary-500' : ''}>
                  {cat}
                </ButtonSecondary>
              </Link>
            ))}
          </div>
        )}

        {/* DEVOTIONALS GRID */}
        {posts.length > 0 ? (
          <>
            <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/devotionals/${post.handle}`} className="group">
                  <article className="post-card-11 relative flex flex-col rounded-3xl bg-white dark:bg-white/5 overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden">
                      <img
                        src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                        alt={post.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {post.categories?.[0] && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-600 text-white">
                          {post.categories[0].name}
                        </span>
                      )}
                    </div>
                    <div className="flex grow flex-col gap-y-3 p-4 border border-t-0 rounded-b-3xl border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs text-neutral-500 font-body">
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 font-heading">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 font-body">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between text-xs text-neutral-500 font-body">
                        <span>{post.readingTime} min read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                {currentPage > 1 && (
                  <Link href={`/devotionals?page=${currentPage - 1}${category ? `&category=${category}` : ''}`}>
                    <ButtonSecondary>Previous</ButtonSecondary>
                  </Link>
                )}
                <span className="text-sm text-neutral-500">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link href={`/devotionals?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}>
                    <ButtonSecondary>Next</ButtonSecondary>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 font-heading">
              No devotionals found
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-body">
              {category ? `No devotionals in the "${category}" category yet.` : 'Check back soon for inspiring daily readings.'}
            </p>
            {category && (
              <Link href="/devotionals" className="mt-6 inline-block">
                <ButtonPrimary>View all devotionals</ButtonPrimary>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
