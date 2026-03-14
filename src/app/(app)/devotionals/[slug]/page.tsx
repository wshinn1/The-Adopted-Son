import BlogPostPage from '@/components/blog/BlogPostPage'
import PaywallGate from '@/components/devotional/PaywallGate'
import TrialBanner from '@/components/devotional/TrialBanner'
import HamburgerHeader from '@/components/HamburgerHeader'
import NewsletterSignUp from '@/components/sections/NewsletterSignUp'
import { getDevotionalBySlug, getDevotionals, devotionalToPost } from '@/lib/devotional-mapper'
import { getSiteSettings } from '@/lib/site-settings'
import { checkAccess } from '@/lib/trial'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Disable caching to ensure fresh data
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const devotional = await getDevotionalBySlug(supabaseAdmin, slug)

  // Use SEO fields if available, fallback to regular fields
  const title = devotional?.seo_title || devotional?.title 
    ? `${devotional?.seo_title || devotional?.title} — The Adopted Son` 
    : 'Devotional'
  const description = devotional?.seo_description || devotional?.excerpt || 'A daily devotional from The Adopted Son'
  const imageUrl = devotional?.cover_image_url ?? 'https://www.theadoptedson.com/og-image.jpg'
  const keywords = devotional?.seo_keywords?.split(',').map(k => k.trim()).filter(Boolean) || []

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : ['devotional', 'Christian', 'faith', 'daily reading', 'The Adopted Son'],
    authors: devotional?.author_name ? [{ name: devotional.author_name }] : [{ name: 'The Adopted Son' }],
    creator: devotional?.author_name || 'The Adopted Son',
    publisher: 'The Adopted Son',
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: devotional?.published_at || undefined,
      authors: devotional?.author_name ? [devotional.author_name] : ['The Adopted Son'],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: devotional?.title ?? 'The Adopted Son Devotional',
        },
      ],
      siteName: 'The Adopted Son',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@theadoptedson',
    },
    alternates: {
      canonical: `https://www.theadoptedson.com/devotionals/${slug}`,
    },
  }
}

export default async function DevotionalPage({ params }: Props) {
  const { slug } = await params
  const settings = await getSiteSettings()

  const devotional = await getDevotionalBySlug(supabaseAdmin, slug)

  if (!devotional || !devotional.is_published) {
    notFound()
  }

  // Check access for premium content
  const access = await checkAccess()
  const canRead = !devotional.is_premium || access.hasAccess

  // Get related devotionals
  const relatedDevotionals = await getDevotionals(supabaseAdmin, { limit: 4, published: true })
  const relatedPosts = relatedDevotionals
    .filter(d => d.id !== devotional.id)
    .slice(0, 3)
    .map(devotionalToPost)

  // Build the post object for BlogPostPage
  const post = {
    id: devotional.id,
    title: devotional.title,
    slug: devotional.slug,
    excerpt: devotional.excerpt,
    content: canRead ? (devotional.content as Record<string, unknown> | null) : getTeaserContent(devotional.content),
    cover_image_url: devotional.cover_image_url,
    cover_image_caption: devotional.cover_image_caption,
    scripture_reference: devotional.scripture_reference,
    scripture_text: devotional.scripture_text,
    category: devotional.category,
    tags: devotional.tags,
    read_time_minutes: devotional.read_time_minutes,
    published_at: devotional.published_at,
    authors: devotional.authors,
    author_name: devotional.author_name ?? 'The Adopted Son',
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: devotional.title,
    description: devotional.excerpt || '',
    image: devotional.cover_image_url || 'https://www.theadoptedson.com/og-image.jpg',
    datePublished: devotional.published_at,
    dateModified: devotional.updated_at || devotional.published_at,
    author: {
      '@type': 'Person',
      name: devotional.author_name || 'The Adopted Son',
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Adopted Son',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.theadoptedson.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.theadoptedson.com/devotionals/${devotional.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <HamburgerHeader
        siteName={settings.site_name}
        logoType={settings.logo_type}
        logoUrl={settings.logo_url || undefined}
        navLinks={settings.nav_links}
      />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      <TrialBanner />
        
      {/* Main Blog Post */}
        <BlogPostPage post={post} shareSettings={settings.share_buttons} />

        {/* Paywall (if premium and no access) */}
        {!canRead && (
          <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-8 pb-16">
            <PaywallGate reason={access.reason} />
          </div>
        )}

      {/* Newsletter Signup */}
      {settings.show_newsletter_on_posts && canRead && (
        <NewsletterSignUp
          data={{
            heading: settings.newsletter_settings?.heading || 'Stay Connected',
            subheading: settings.newsletter_settings?.subheading || 'Get daily devotionals and spiritual encouragement delivered to your inbox.',
            button_text: settings.newsletter_settings?.button_text || 'Subscribe',
            success_message: 'Thank you for subscribing! Check your inbox for confirmation.',
            background_color: settings.newsletter_settings?.background_color || '#F5F2ED',
            background_image_url: settings.newsletter_settings?.background_image_url || '',
            text_color: settings.newsletter_settings?.text_color || '#1a1a1a',
          }}
        />
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && canRead && (
        <div className="border-t border-neutral-200">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-neutral-900">
                More Devotionals
              </h2>
              <Link 
                href="/devotionals" 
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/devotionals/${relatedPost.handle}`} className="group">
                  <article>
                    <div className="aspect-[4/3] relative rounded-lg overflow-hidden mb-4">
                      <Image
                        src={typeof relatedPost.featuredImage === 'string' 
                          ? relatedPost.featuredImage 
                          : relatedPost.featuredImage.src}
                        alt={relatedPost.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                    <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Extract first 2 paragraphs as teaser content
function getTeaserContent(content: unknown): Record<string, unknown> | null {
  if (!content || typeof content !== 'object') return null
  
  const doc = content as { type?: string; content?: any[] }
  if (doc.type === 'doc' && Array.isArray(doc.content)) {
    return {
      type: 'doc',
      content: doc.content.slice(0, 2),
    }
  }
  
  return null
}
