import { devotionalToPost, Devotional } from '@/lib/devotional-mapper'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSiteSettings } from '@/lib/site-settings'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import HamburgerHeader from '@/components/HamburgerHeader'
import NewsletterSignUp from '@/components/sections/NewsletterSignUp'
import DevotionalsGrid from '@/components/DevotionalsGrid'
import DevotionalsSearch from '@/components/DevotionalsSearch'

export const metadata: Metadata = {
  title: 'Devotionals',
  description: 'Browse all daily devotionals from The Adopted Son. Faith-filled readings to draw you closer to God.',
  openGraph: {
    title: 'Devotionals — The Adopted Son',
    description: 'Browse all daily devotionals from The Adopted Son. Faith-filled readings to draw you closer to God.',
    type: 'website',
    url: 'https://www.theadoptedson.com/devotionals',
    siteName: 'The Adopted Son',
    images: [
      {
        url: 'https://www.theadoptedson.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Devotionals — The Adopted Son',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devotionals — The Adopted Son',
    description: 'Browse all daily devotionals from The Adopted Son.',
    images: ['https://www.theadoptedson.com/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.theadoptedson.com/devotionals',
  },
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

const POSTS_PER_PAGE = 6

export default async function DevotionalsPage({ searchParams }: Props) {
  const { page } = await searchParams
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

  let featuredPost = null
  let sidebarPosts: ReturnType<typeof devotionalToPost>[] = []
  let gridPosts: ReturnType<typeof devotionalToPost>[] = []
  let totalPages = 1

  {
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
      
      {/* Newsletter Signup */}
      {settings.show_newsletter_on_posts && (
        <NewsletterSignUp
          data={{
            heading: settings.newsletter_settings?.heading || 'Stay Connected',
            subheading: settings.newsletter_settings?.subheading || 'Get the latest devotionals and updates delivered to your inbox.',
            button_text: settings.newsletter_settings?.button_text || 'Subscribe',
            success_message: 'Thank you for subscribing! Check your inbox for confirmation.',
            background_color: settings.newsletter_settings?.background_color || '#F5F2ED',
            background_image_url: settings.newsletter_settings?.background_image_url || '',
            text_color: settings.newsletter_settings?.text_color || '#1a1a1a',
            button_bg_color: settings.newsletter_settings?.button_bg_color,
            button_text_color: settings.newsletter_settings?.button_text_color,
            button_hover_bg_color: settings.newsletter_settings?.button_hover_bg_color,
            button_hover_text_color: settings.newsletter_settings?.button_hover_text_color,
          }}
        />
      )}
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Live Search */}
        <DevotionalsSearch />

        {/* Normal Layout — always shown beneath the search component when no query is active */}
        <>

        {/* Devotionals Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-button-primary rounded-full" />
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
                        <span 
                          className="inline-block w-fit px-4 py-1.5 text-sm font-medium rounded-full mb-4"
                          style={{ 
                            backgroundColor: 'var(--color-category-badge-bg)', 
                            color: 'var(--color-category-badge-text)' 
                          }}
                        >
                          {featuredPost.categories[0].name}
                        </span>
                      )}
                      
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 group-hover:text-title-hover transition-colors font-heading leading-tight">
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
                        <div 
                          className="absolute top-3 left-3 px-3 py-2 rounded-lg text-center"
                          style={{
                            backgroundColor: 'var(--color-date-badge-bg)',
                            color: 'var(--color-date-badge-text)',
                          }}
                        >
                          <div className="text-xl font-bold leading-none">{day}</div>
                          <div className="text-xs uppercase">{month}</div>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-title-hover transition-colors font-heading mb-2">
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

        {/* More Devotionals Section - 2-Column Grid with Animation */}
        <DevotionalsGrid
          posts={gridPosts.map(post => ({
            id: post.id,
            handle: post.handle,
            title: post.title,
            excerpt: post.excerpt,
            date: post.date,
            featuredImage: post.featuredImage,
            categories: post.categories,
          }))}
          currentPage={currentPage}
          totalPages={totalPages}
        />
        </>

      </div>
    </div>
  )
}
