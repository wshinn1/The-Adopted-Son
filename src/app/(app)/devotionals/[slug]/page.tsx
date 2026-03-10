import BlogPostPage from '@/components/blog/BlogPostPage'
import PaywallGate from '@/components/devotional/PaywallGate'
import TrialBanner from '@/components/devotional/TrialBanner'
import { getDevotionalBySlug, getDevotionals, devotionalToPost } from '@/lib/devotional-mapper'
import { checkAccess } from '@/lib/trial'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/site-settings'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const devotional = await getDevotionalBySlug(supabase, slug)

  return {
    title: devotional?.title ? `${devotional.title} — The Adopted Son` : 'Devotional',
    description: devotional?.excerpt ?? 'A daily devotional from The Adopted Son',
  }
}

export default async function DevotionalPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const [devotional, siteSettings] = await Promise.all([
    getDevotionalBySlug(supabase, slug),
    getSiteSettings(),
  ])

  if (!devotional || !devotional.is_published) notFound()

  // Check access for premium content
  const access = await checkAccess()
  const canRead = !devotional.is_premium || access.hasAccess

  // Get related devotionals
  const relatedDevotionals = await getDevotionals(supabase, { limit: 4, published: true })
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
    scripture_reference: devotional.scripture_reference,
    scripture_text: devotional.scripture_text,
    category: devotional.category,
    tags: devotional.tags,
    read_time_minutes: devotional.read_time_minutes,
    published_at: devotional.published_at,
    author: devotional.author,
  }

  return (
    <div className="relative bg-white">
      <TrialBanner />
      
      {/* Main Blog Post */}
      <BlogPostPage 
        post={post} 
        typography={siteSettings.typography}
      />

      {/* Paywall (if premium and no access) */}
      {!canRead && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-8 pb-16">
          <PaywallGate reason={access.reason} />
        </div>
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
