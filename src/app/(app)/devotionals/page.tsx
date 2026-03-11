import { devotionalToPost, getDevotionals, Devotional } from '@/lib/devotional-mapper'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSiteSettings } from '@/lib/site-settings'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import TrialBanner from '@/components/devotional/TrialBanner'
import HamburgerHeader from '@/components/HamburgerHeader'

export const metadata: Metadata = {
  title: 'All Devotionals — The Adopted Son',
  description: 'Browse all daily devotionals from The Adopted Son.',
}

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>
}

const POSTS_PER_PAGE = 6

export default async function DevotionalsPage({ searchParams }: Props) {
  const { page, search } = await searchParams
  const currentPage = parseInt(page ?? '1', 10)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  // Use admin client to bypass RLS and ensure all visitors can see posts
  const supabase = supabaseAdmin
  const settings = await getSiteSettings()

  // Fetch featured post (prioritize is_featured, fallback to most recent)
  let featuredData = null
  
  // First try to get a post marked as featured
  const { data: markedFeatured } = await supabase
    .from('devotionals')
    .select(`
      *,
      author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  
  if (markedFeatured) {
    featuredData = markedFeatured
  } else {
    // Fallback to most recent post
    const { data: mostRecent } = await supabase
      .from('devotionals')
      .select(`
        *,
        author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()
    featuredData = mostRecent
  }

  const featuredPost = featuredData ? devotionalToPost(featuredData as Devotional) : null
  const featuredId = featuredData?.id

  // Fetch sidebar posts (next 4, excluding featured)
  let sidebarQuery = supabase
    .from('devotionals')
    .select(`
      *,
      author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(4)
  
  if (featuredId) {
    sidebarQuery = sidebarQuery.neq('id', featuredId)
  }
  
  const { data: sidebarData } = await sidebarQuery

  const sidebarPosts = (sidebarData || []).map((d: Devotional) => devotionalToPost(d))
  const excludeIds = [featuredId, ...sidebarPosts.map(p => p.id)].filter(Boolean)

  // Build query for main grid (excluding featured and sidebar posts)
  let query = supabase
    .from('devotionals')
    .select(`
      *,
      author:profiles!devotionals_author_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('is_published', true)
  
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }
  
  query = query.order('published_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1)

  // Apply search filter if provided
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
  }

  const { data: gridData, count } = await query

  const gridPosts = (gridData || []).map((d: Devotional) => devotionalToPost(d))
  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerHeader
        siteName={settings.site_name}
        logoType={settings.logo_type}
        logoUrl={settings.logo_url || undefined}
        navLinks={settings.nav_links}
      />
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      <TrialBanner />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Search Bar */}
        <div className="mb-12">
          <form action="/devotionals" method="get" className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search devotionals..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
            />
          </form>
        </div>

        {/* Suggested Articles Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Suggested Articles</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured Post - Large Card */}
            {featuredPost && (
              <div className="lg:col-span-2">
                <Link href={`/devotionals/${featuredPost.handle}`} className="group block">
                  <div className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Square Image */}
                    <div className="relative w-full md:w-[45%] aspect-square flex-shrink-0">
                      <Image
                        src={typeof featuredPost.featuredImage === 'string' ? featuredPost.featuredImage : featuredPost.featuredImage.src}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        priority
                        loading="eager"
                        unoptimized
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex flex-col justify-center p-6 md:p-8 flex-1">
                      {featuredPost.categories?.[0] && (
                        <span className="inline-block w-fit px-4 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-600 mb-4">
                          {featuredPost.categories[0].name}
                        </span>
                      )}
                      
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors font-heading leading-tight">
                        {featuredPost.title}
                      </h3>
                      
                      {featuredPost.excerpt && (
                        <p className="text-gray-600 mb-6 line-clamp-3 text-base leading-relaxed font-body">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      
                      {/* Author */}
                      <div className="flex items-center gap-3 mt-auto">
                        <Image
                          src={featuredPost.author.avatar.src}
                          alt={featuredPost.author.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                          unoptimized
                        />
                        <div>
                          <p className="font-semibold text-gray-900 font-body">{featuredPost.author.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(featuredPost.date)}</span>
                            <span>·</span>
                            <Clock className="size-4" />
                            <span>{featuredPost.readingTime} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Sidebar - Recent Posts List */}
            <div className="space-y-4">
              {sidebarPosts.map((post) => (
                <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block">
                  <div className="flex gap-4 p-4 bg-white rounded-xl border-l-4 border-blue-500 hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors font-heading">
                        {post.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span className="font-medium font-body">{post.author.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(post.date).split(',')[0]}</span>
                          <span>·</span>
                          <Clock className="size-3.5" />
                          <span>{post.readingTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recently Published Section - 3-Column Grid */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Recently Published</h2>
          </div>

          {gridPosts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gridPosts.map((post, index) => (
                  <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block">
                    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={index < 3}
                          loading={index < 3 ? "eager" : "lazy"}
                          unoptimized
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5">
                        {post.categories?.[0] && (
                          <span className="inline-block w-fit px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 mb-3">
                            {post.categories[0].name}
                          </span>
                        )}
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors font-heading">
                          {post.title}
                        </h3>
                        
                        {post.excerpt && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1 font-body">
                            {post.excerpt}
                          </p>
                        )}
                        
                        {/* Author */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                          <Image
                            src={post.author.avatar.src}
                            alt={post.author.name}
                            width={36}
                            height={36}
                            className="rounded-full"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm font-body">{post.author.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatDate(post.date).split(',')[0]}</span>
                              <span>·</span>
                              <Clock className="size-3" />
                              <span>{post.readingTime} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {currentPage > 1 && (
                    <Link
                      href={`/devotionals?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Link
                        key={pageNum}
                        href={`/devotionals?page=${pageNum}${search ? `&search=${search}` : ''}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-body ${
                          pageNum === currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    ))}
                  </div>
                  
                  {currentPage < totalPages && (
                    <Link
                      href={`/devotionals?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-800 font-heading">
                {search ? `No results for "${search}"` : 'No devotionals found'}
              </h3>
              <p className="mt-4 text-gray-600 font-body">
                {search ? 'Try a different search term.' : 'Check back soon for inspiring daily readings.'}
              </p>
              {search && (
                <Link href="/devotionals" className="mt-6 inline-block px-6 py-3 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
                  View all devotionals
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
