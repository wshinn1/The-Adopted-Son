'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Twitter, Share2 } from 'lucide-react'

interface Author {
  full_name?: string | null
  avatar_url?: string | null
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: Record<string, unknown> | null
  cover_image_url?: string | null
  scripture_reference?: string | null
  scripture_text?: string | null
  category?: string | null
  tags?: string[] | null
  read_time_minutes?: number | null
  published_at?: string | null
  author?: Author | null
  author_name?: string | null
}

interface Props {
  post: BlogPost
}

export default function BlogPostPage({ post }: Props) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  // Prioritize author_name field, fallback to author.full_name, then default
  const authorName = post.author_name || post.author?.full_name || 'The Adopted Son'

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = encodeURIComponent(post.title)

  return (
    <article className="min-h-screen bg-white">
      {/* Article Container - Centered with balanced margins */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 leading-tight font-heading">
          {post.title}
        </h1>

        {/* Meta row: Author + Share buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {/* Author info */}
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full overflow-hidden bg-neutral-200 shrink-0">
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={authorName}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                  unoptimized={post.author.avatar_url.includes('blob.vercel-storage.com')}
                />
              ) : (
                <div className="size-full flex items-center justify-center text-neutral-500 font-semibold">
                  {authorName[0]}
                </div>
              )}
            </div>
            <div className="text-sm">
              <div className="text-neutral-600">
                By<span className="font-semibold text-neutral-900 uppercase ml-1">{authorName}</span>
              </div>
              <div className="text-neutral-500">
                {publishedDate}
                {post.read_time_minutes ? (
                  <>
                    <span className="mx-2">·</span>
                    {post.read_time_minutes} mins read
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 mr-1">Share this:</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="size-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              aria-label="Share on Facebook"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="size-9 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              aria-label="Share on Twitter"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href={`https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="size-9 rounded-full bg-[#E60023] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              aria-label="Share on Pinterest"
            >
              <Share2 className="size-4" />
            </a>
          </div>
        </div>

        {/* Featured Image */}
        {post.cover_image_url && (
          <div className="mt-10 aspect-[16/10] relative rounded-lg overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              loading="eager"
              unoptimized={post.cover_image_url.includes('blob.vercel-storage.com')}
            />
          </div>
        )}

        {/* Scripture Block (if applicable) */}
        {post.scripture_reference && (
          <div className="mt-10 py-6 border-y border-neutral-200">
            <p className="text-sm font-medium text-neutral-500 mb-2">
              {post.scripture_reference}
            </p>
            {post.scripture_text && (
              <p className="text-xl italic text-neutral-700 leading-relaxed font-body">
                "{post.scripture_text}"
              </p>
            )}
          </div>
        )}

        {/* Excerpt - Large italic intro text */}
        {post.excerpt && (
          <p className="mt-10 text-xl md:text-2xl text-neutral-700 leading-relaxed font-body">
            {post.excerpt}
          </p>
        )}

        {/* Body Content */}
        <div className="mt-8 font-body">
          <BlogContent content={post.content} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <Link
                  key={i}
                  href={`/devotionals?tag=${encodeURIComponent(tag)}`}
                  className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-600 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-full overflow-hidden bg-neutral-200 shrink-0">
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={authorName}
                  width={64}
                  height={64}
                  className="size-full object-cover"
                  unoptimized={post.author.avatar_url.includes('blob.vercel-storage.com')}
                />
              ) : (
                <div className="size-full flex items-center justify-center text-neutral-500 text-xl font-semibold">
                  {authorName[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Written by</p>
              <p className="text-lg font-semibold text-neutral-900">
                {authorName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

// Blog content renderer with drop cap support
function BlogContent({ content }: { content?: Record<string, unknown> | null }) {
  if (!content) return <p className="text-neutral-600">No content available.</p>

  // If content is TipTap JSON
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return <TipTapRenderer content={content as { type: string; content: unknown[] }} />
  }

  return <p className="text-neutral-600">Content format not recognized.</p>
}

// Enhanced TipTap renderer with drop cap and better styling
function TipTapRenderer({ content }: { content: { type: string; content: unknown[] } }) {
  let isFirstParagraph = true

  return (
    <div className="prose prose-lg prose-neutral max-w-none">
      {content.content.map((node: any, index: number) => {
        if (node.type === 'paragraph') {
          const text = extractText(node)
          
          // Drop cap for first paragraph
          if (isFirstParagraph && text.length > 0) {
            isFirstParagraph = false
            const firstChar = text[0]
            const restOfText = text.slice(1)
            
            return (
              <p key={index} className="text-lg text-neutral-700 leading-relaxed">
                <span className="float-left text-6xl font-serif font-bold text-neutral-900 mr-3 mt-1 leading-none">
                  {firstChar}
                </span>
                <RenderInlineContent content={node.content} skipFirst />
              </p>
            )
          }
          
          return (
            <p key={index} className="text-lg text-neutral-700 leading-relaxed my-6">
              <RenderInlineContent content={node.content} />
            </p>
          )
        }

        if (node.type === 'heading') {
          const level = node.attrs?.level || 2
          const text = extractText(node)
          const className = level === 1 
            ? 'text-3xl font-bold text-neutral-900 mt-12 mb-6 font-heading'
            : level === 2 
              ? 'text-2xl font-bold text-neutral-900 mt-10 mb-4 font-heading'
              : 'text-xl font-semibold text-neutral-900 mt-8 mb-3 font-heading'
          
          if (level === 1) return <h1 key={index} className={className}>{text}</h1>
          if (level === 2) return <h2 key={index} className={className}>{text}</h2>
          if (level === 3) return <h3 key={index} className={className}>{text}</h3>
          if (level === 4) return <h4 key={index} className={className}>{text}</h4>
          if (level === 5) return <h5 key={index} className={className}>{text}</h5>
          return <h6 key={index} className={className}>{text}</h6>
        }

        if (node.type === 'bulletList') {
          return (
            <ul key={index} className="list-disc pl-6 my-6 space-y-2">
              {node.content?.map((item: any, i: number) => (
                <li key={i} className="text-lg text-neutral-700">
                  {extractText(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (node.type === 'orderedList') {
          return (
            <ol key={index} className="list-decimal pl-6 my-6 space-y-2">
              {node.content?.map((item: any, i: number) => (
                <li key={i} className="text-lg text-neutral-700">
                  {extractText(item)}
                </li>
              ))}
            </ol>
          )
        }

        if (node.type === 'blockquote') {
          return (
            <blockquote key={index} className="border-l-4 border-neutral-300 pl-6 my-8 italic text-neutral-600">
              {node.content?.map((p: any, i: number) => (
                <p key={i}>{extractText(p)}</p>
              ))}
            </blockquote>
          )
        }

        if (node.type === 'horizontalRule') {
          return <hr key={index} className="my-10 border-neutral-200" />
        }

        if (node.type === 'image') {
          return (
            <figure key={index} className="my-8">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={node.attrs?.src || ''}
                  alt={node.attrs?.alt || ''}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {node.attrs?.title && (
                <figcaption className="text-sm text-neutral-500 mt-2">
                  {node.attrs.title}
                </figcaption>
              )}
            </figure>
          )
        }

        // Handle image galleries (3-column grid)
        if (node.type === 'imageGallery' || (node.type === 'columns' && node.attrs?.count === 3)) {
          return (
            <div key={index} className="grid grid-cols-3 gap-4 my-8">
              {node.content?.map((col: any, i: number) => (
                <div key={i} className="aspect-square relative rounded-lg overflow-hidden">
                  {col.content?.[0]?.type === 'image' && (
                    <Image
                      src={col.content[0].attrs?.src || ''}
                      alt={col.content[0].attrs?.alt || ''}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              ))}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// Helper to extract text from a node
function extractText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.content) {
    return node.content.map((child: any) => extractText(child)).join('')
  }
  return ''
}

// Render inline content with marks
function RenderInlineContent({ content, skipFirst = false }: { content?: any[]; skipFirst?: boolean }) {
  if (!content) return null
  
  return (
    <>
      {content.map((child: any, i: number) => {
        if (child.type === 'text') {
          let text = child.text || ''
          
          if (skipFirst && i === 0 && text.length > 0) {
            text = text.slice(1)
          }
          
          if (child.marks) {
            let element: React.ReactNode = text
            child.marks.forEach((mark: any) => {
              if (mark.type === 'bold') {
                element = <strong key={`${i}-bold`}>{element}</strong>
              }
              if (mark.type === 'italic') {
                element = <em key={`${i}-italic`}>{element}</em>
              }
              if (mark.type === 'link') {
                element = (
                  <a 
                    key={`${i}-link`} 
                    href={mark.attrs?.href} 
                    className="text-blue-600 hover:text-blue-800 underline"
                    target={mark.attrs?.target || '_self'}
                  >
                    {element}
                  </a>
                )
              }
              if (mark.type === 'superscript') {
                element = <sup key={`${i}-sup`}>{element}</sup>
              }
            })
            return <span key={i}>{element}</span>
          }
          
          return <span key={i}>{text}</span>
        }
        return null
      })}
    </>
  )
}
