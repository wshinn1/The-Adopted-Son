import SingleHeaderContainer from '@/app/(app)/post/SingleHeaderContainer'
import PaywallGate from '@/components/devotional/PaywallGate'
import TrialBanner from '@/components/devotional/TrialBanner'
import { devotionalToPost, devotionalToPostDetail, getDevotionalBySlug, getDevotionals, Devotional } from '@/lib/devotional-mapper'
import { checkAccess } from '@/lib/trial'
import { createClient } from '@/lib/supabase/server'
import { Divider } from '@/shared/divider'
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

  const devotional = await getDevotionalBySlug(supabase, slug)
  if (!devotional || !devotional.is_published) notFound()

  // Check access for premium content
  const access = await checkAccess()
  const canRead = !devotional.is_premium || access.hasAccess

  // Convert to template format for header
  const postDetail = devotionalToPostDetail(devotional)

  // Get related devotionals for sidebar
  const relatedDevotionals = await getDevotionals(supabase, { limit: 6, published: true })
  const relatedPosts = relatedDevotionals
    .filter(d => d.id !== devotional.id)
    .slice(0, 5)
    .map(devotionalToPost)

  // Get unique categories for sidebar
  const { data: categoriesData } = await supabase
    .from('devotionals')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)
  
  const uniqueCategories = [...new Set(categoriesData?.map(d => d.category).filter(Boolean))].slice(0, 6)

  return (
    <div className="relative">
      <TrialBanner />
      
      {/* HEADER */}
      <SingleHeaderContainer 
        post={postDetail as any} 
        headerStyle="style1"
      />

      {/* CONTENT */}
      <div className="container mt-12 flex flex-col lg:flex-row">
        {/* MAIN CONTENT */}
        <div className="w-full lg:w-3/5 xl:w-2/3 xl:pe-20">
          {/* SCRIPTURE REFERENCE */}
          {devotional.scripture_reference && (
            <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-l-4 border-indigo-500">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                {devotional.scripture_reference}
              </p>
              {devotional.scripture_text && (
                <p className="text-lg italic text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  "{devotional.scripture_text}"
                </p>
              )}
            </div>
          )}

          {/* DEVOTIONAL BODY */}
          {canRead ? (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <DevotionalBodyContent content={devotional.content} />
            </div>
          ) : (
            <>
              {/* TEASER - Show first paragraph */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <DevotionalTeaser content={devotional.content} />
              </div>
              
              {/* PAYWALL */}
              <PaywallGate reason={access.reason} />
            </>
          )}

          {/* TAGS */}
          {devotional.tags && devotional.tags.length > 0 && canRead && (
            <div className="mt-10 flex flex-wrap gap-2">
              {devotional.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Divider className="my-12" />

          {/* AUTHOR */}
          {devotional.author && (
            <div className="flex items-start gap-4 mb-12">
              <div className="size-16 rounded-full overflow-hidden bg-neutral-200 shrink-0">
                {devotional.author.avatar_url ? (
                  <img
                    src={devotional.author.avatar_url}
                    alt={devotional.author.full_name || 'Author'}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-neutral-500 text-xl font-semibold">
                    {(devotional.author.full_name || 'A')[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Written by</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {devotional.author.full_name || 'The Adopted Son'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="mt-12 w-full lg:mt-0 lg:w-2/5 lg:ps-10 xl:w-1/3 xl:ps-0">
          <div className="space-y-7 lg:sticky lg:top-7">
            {/* CATEGORIES */}
            {uniqueCategories.length > 0 && (
              <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Categories</h3>
                </div>
                <div className="p-4 space-y-2">
                  {uniqueCategories.map((cat, i) => (
                    <Link
                      key={i}
                      href={`/devotionals?category=${encodeURIComponent(cat!)}`}
                      className="block px-4 py-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* RELATED POSTS */}
            {relatedPosts.length > 0 && (
              <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Recent Devotionals</h3>
                  <Link href="/devotionals" className="text-sm text-primary-600 hover:text-primary-700">
                    View all
                  </Link>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {relatedPosts.slice(0, 4).map((post) => (
                    <Link
                      key={post.id}
                      href={`/devotionals/${post.handle}`}
                      className="flex gap-4 p-4 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <div className="size-16 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                          alt={post.title}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {post.title}
                        </h4>
                        <span className="text-xs text-neutral-500 mt-1 block">
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED DEVOTIONALS */}
      {relatedPosts.length > 0 && canRead && (
        <div className="container py-16 lg:py-24">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            More Devotionals
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href={`/devotionals/${post.handle}`} className="group">
                <article className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                      alt={post.title}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 line-clamp-2">{post.excerpt}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Component to render TipTap content
function DevotionalBodyContent({ content }: { content: any }) {
  if (!content) return <p>No content available.</p>
  
  // If content is TipTap JSON, render it
  if (typeof content === 'object' && content.type === 'doc') {
    return <TipTapRenderer content={content} />
  }
  
  // If content is a string (HTML or plain text)
  if (typeof content === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }
  
  return <p>Content format not recognized.</p>
}

// Show first paragraph as teaser
function DevotionalTeaser({ content }: { content: any }) {
  if (!content) return null
  
  if (typeof content === 'object' && content.type === 'doc' && content.content) {
    // Get first 2 paragraphs
    const firstNodes = content.content.slice(0, 2)
    return <TipTapRenderer content={{ type: 'doc', content: firstNodes }} />
  }
  
  if (typeof content === 'string') {
    // Get first 200 characters
    const teaser = content.substring(0, 200)
    return <p>{teaser}...</p>
  }
  
  return null
}

// Simple TipTap JSON renderer
function TipTapRenderer({ content }: { content: any }) {
  if (!content?.content) return null
  
  return (
    <>
      {content.content.map((node: any, index: number) => {
        if (node.type === 'paragraph') {
          return (
            <p key={index}>
              {node.content?.map((child: any, i: number) => {
                if (child.type === 'text') {
                  let text = child.text
                  if (child.marks) {
                    child.marks.forEach((mark: any) => {
                      if (mark.type === 'bold') text = <strong key={i}>{text}</strong>
                      if (mark.type === 'italic') text = <em key={i}>{text}</em>
                    })
                  }
                  return <span key={i}>{text}</span>
                }
                return null
              })}
            </p>
          )
        }
        if (node.type === 'heading') {
          const level = node.attrs?.level || 2
          const text = node.content?.map((child: any) => child.text).join('') || ''
          if (level === 1) return <h1 key={index}>{text}</h1>
          if (level === 2) return <h2 key={index}>{text}</h2>
          if (level === 3) return <h3 key={index}>{text}</h3>
          if (level === 4) return <h4 key={index}>{text}</h4>
          if (level === 5) return <h5 key={index}>{text}</h5>
          return <h6 key={index}>{text}</h6>
        }
        if (node.type === 'bulletList') {
          return (
            <ul key={index}>
              {node.content?.map((item: any, i: number) => (
                <li key={i}>
                  {item.content?.[0]?.content?.map((c: any) => c.text).join('')}
                </li>
              ))}
            </ul>
          )
        }
        if (node.type === 'blockquote') {
          return (
            <blockquote key={index}>
              {node.content?.map((p: any, i: number) => (
                <p key={i}>{p.content?.map((c: any) => c.text).join('')}</p>
              ))}
            </blockquote>
          )
        }
        return null
      })}
    </>
  )
}
