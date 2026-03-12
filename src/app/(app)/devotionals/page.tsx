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

  // Helper function to attach authors to devotionals
  async function attachAuthors(devotionals: any[]) {
    const authorIds = [...new Set(devotionals.filter(d => d.author_id).map(d => d.author_id))]
    if (authorIds.length === 0) return devotionals
    
    const { data: authors } = await supabase
      .from('authors')
      .select('id, name, avatar_url, website_url, bio')
      .in('id', authorIds)
    
    if (authors) {
      const authorMap = new Map(authors.map((a: any) => [a.id, {
        ...a,
        website: a.website_url  // Map to expected field name
      }]))
      devotionals.forEach(d => {
        if (d.author_id && authorMap.has(d.author_id)) {
          d.authors = authorMap.get(d.author_id)
        }
      })
    }
    return devotionals
  }

  // --- SEARCH MODE: bypass featured/sidebar layout entirely ---
  let featuredPost = null
  let sidebarPosts: ReturnType<typeof devotionalToPost>[] = []
  let gridPosts: ReturnType<typeof devotionalToPost>[] = []
  let totalPages = 1

  if (search && search.trim().length > 0) {
    // Search across title, excerpt, content, and categories
    // First get matching devotional IDs from categories
    const { data: categoryMatches } = await supabase
      .from('devotional_categories')
      .select('devotional_id, categories(name)')
      .ilike('categories.name', `%${search}%`)

    const categoryMatchIds = (categoryMatches || [])
      .filter((m: any) => m.categories)
      .map((m: any) => m.devotional_id)

    // Build search query across title, excerpt, content
    let searchQuery = supabase
      .from('devotionals')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
      .order('published_at', { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1)

    const { data: searchData, count: searchCount } = await searchQuery
    let results = searchData || []

    // Also fetch category matches not already included
    if (categoryMatchIds.length > 0) {
      const existingIds = new Set(results.map((r: any) => r.id))
      const newIds = categoryMatchIds.filter((id: string) => !existingIds.has(id))
      if (newIds.length > 0) {
        const { data: catResults } = await supabase
          .from('devotionals')
          .select('*')
          .eq('is_published', true)
          .in('id', newIds)
        results = [...results, ...(catResults || [])]
      }
    }

    const withAuthors = await attachAuthors(results)
    gridPosts = withAuthors.map((d: Devotional) => devotionalToPost(d))
    totalPages = Math.ceil(((searchCount ?? 0) + categoryMatchIds.length) / POSTS_PER_PAGE)

  } else {
    // --- NORMAL MODE: featured + sidebar + grid ---

    // Fetch featured post (prioritize is_featured, fallback to most recent)
    let featuredData = null
    
    const { data: markedFeatured } = await supabase
      .from('devotionals')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()
    
    if (markedFeatured) {
      featuredData = markedFeatured
    } else {
      const { data: mostRecent } = await supabase
        .from('devotionals')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single()
      featuredData = mostRecent
    }

    if (featuredData) {
      const withAuthor = await attachAuthors([featuredData])
      featuredData = withAuthor[0]
    }

    featuredPost = featuredData ? devotionalToPost(featuredData as Devotional) : null
    const featuredId = featuredData?.id

    let sidebarQuery = supabase
      .from('devotionals')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(2)
    
    if (featuredId) {
      sidebarQuery = sidebarQuery.neq('id', featuredId)
    }
    
    const { data: sidebarData } = await sidebarQuery
    const sidebarWithAuthors = await attachAuthors(sidebarData || [])
    sidebarPosts = sidebarWithAuthors.map((d: Devotional) => devotionalToPost(d))
    
    const excludeIds = [featuredId, ...sidebarPosts.map(p => p.id)].filter(Boolean)

    let query = supabase
      .from('devotionals')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
    
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    
    query = query.order('published_at', { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1)

    const { data: gridData, count } = await query
    const gridWithAuthors = await attachAuthors(gridData || [])
    gridPosts = gridWithAuthors.map((d: Devotional) => devotionalToPost(d))
    totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE)
  }

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

        {/* Search Results or Normal Layout */}
        {search && search.trim().length > 0 ? (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900 font-heading">
                {gridPosts.length > 0 ? `Results for "${search}"` : `No results for "${search}"`}
              </h2>
            </div>

            {gridPosts.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 gap-8">
                  {gridPosts.map((post, index) => {
                    const postDate = new Date(post.date)
                    const day = postDate.getDate()
                    const month = postDate.toLocaleDateString('en-US', { month: 'short' })
                    return (
                      <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block">
                        <article>
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
                            <Image
                              src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              priority={index < 2}
                              unoptimized
                            />
                            <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-4 py-2 rounded-lg text-center">
                              <div className="text-2xl font-bold leading-none">{day}</div>
                              <div className="text-xs uppercase">{month}</div>
                            </div>
                          </div>
                          {post.categories && post.categories.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-3">
                              {post.categories.slice(0, 3).map((cat, i) => (
                                <span key={i} className="text-sm font-medium text-rose-500">
                                  #{cat.name.toLowerCase().replace(/\s+/g, '')}
                                </span>
                              ))}
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors font-heading">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-gray-600 line-clamp-3 font-body leading-relaxed">{post.excerpt}</p>
                          )}
                        </article>
                      </Link>
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    {currentPage > 1 && (
                      <Link href={`/devotionals?page=${currentPage - 1}&search=${search}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body">
                        <ChevronLeft className="size-4" /> Previous
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Link key={pageNum} href={`/devotionals?page=${pageNum}&search=${search}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-body ${pageNum === currentPage ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        {pageNum}
                      </Link>
                    ))}
                    {currentPage < totalPages && (
                      <Link href={`/devotionals?page=${currentPage + 1}&search=${search}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body">
                        Next <ChevronRight className="size-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center bg-white rounded-2xl">
                <p className="text-gray-600 font-body">Try a different search term.</p>
                <Link href="/devotionals" className="mt-6 inline-block px-6 py-3 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
                  View all devotionals
                </Link>
              </div>
            )}
          </section>
        ) : (
        <>

        {/* Devotionals Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Devotionals</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured Post - Large Card */}
            {featuredPost && (
              <div className="lg:col-span-2">
                <Link href={`/devotionals/${featuredPost.handle}`} className="group block h-full">
                  <div className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
                    {/* Image - fills full height of card */}
                    <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto">
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

            {/* Sidebar - Two latest posts (after featured) matching featured height */}
            <div className="flex flex-col gap-4 lg:h-full">
              {sidebarPosts.map((post) => {
                const postDate = new Date(post.date)
                const day = postDate.getDate()
                const month = postDate.toLocaleDateString('en-US', { month: 'short' })
                
                return (
                  <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block flex-1">
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                      {/* Image with date badge */}
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        {/* Date Badge */}
                        <div className="absolute top-3 left-3 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-center">
                          <div className="text-xl font-bold leading-none">{day}</div>
                          <div className="text-xs uppercase">{month}</div>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors font-heading mb-2">
                          {post.title}
                        </h4>
                        {post.excerpt && (
                          <p className="text-gray-500 text-sm line-clamp-2 font-body flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                          <span className="font-medium">{post.author.name}</span>
                          <span>·</span>
                          <Clock className="size-3" />
                          <span>{post.readingTime} min</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* More Devotionals Section - 2-Column Grid with StoryHub Style */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 font-heading">More Devotionals</h2>
          </div>

          {gridPosts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-8">
                {gridPosts.map((post, index) => {
                  const postDate = new Date(post.date)
                  const day = postDate.getDate()
                  const month = postDate.toLocaleDateString('en-US', { month: 'short' })
                  
                  return (
                    <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block">
                      <article>
                        {/* Large Image with Date Badge */}
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
                          <Image
                            src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            priority={index < 2}
                            loading={index < 2 ? "eager" : "lazy"}
                            unoptimized
                          />
                          {/* Date Badge */}
                          <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-4 py-2 rounded-lg text-center">
                            <div className="text-2xl font-bold leading-none">{day}</div>
                            <div className="text-xs uppercase">{month}</div>
                          </div>
                        </div>
                        
                        {/* Categories/Tags */}
                        {post.categories && post.categories.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-3">
                            {post.categories.slice(0, 3).map((cat, i) => (
                              <span key={i} className="text-sm font-medium text-rose-500">
                                #{cat.name.toLowerCase().replace(/\s+/g, '')}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors font-heading">
                          {post.title}
                        </h3>
                        
                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-gray-600 line-clamp-3 font-body leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                      </article>
                    </Link>
                  )
                })}
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
        </>
        )}

      </div>
    </div>
  )
}
