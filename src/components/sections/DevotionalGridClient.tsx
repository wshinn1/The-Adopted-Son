'use client'

import Link from 'next/link'
import Image from 'next/image'

export interface GridDevo {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
}

export interface DevotionalGridData {
  heading?: string
  featured_devotional_id?: string
  grid_devotional_ids?: string[]
  cta_text?: string
  cta_link?: string
  card_text_color?: string
}

interface Props {
  data: DevotionalGridData
  featured: GridDevo | null
  gridPosts: GridDevo[]
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DevotionalGridClient({ data, featured, gridPosts }: Props) {
  const { heading, cta_text, cta_link, card_text_color } = data
  const c = card_text_color || null

  if (!featured && gridPosts.length === 0) return null

  return (
    <section className="w-full py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {heading && (
          <h2 className="font-heading font-black text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100 mb-6">
            {heading}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Featured post — left */}
          {featured && (
            <Link
              href={`/devotionals/${featured.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 shrink-0">
                {featured.cover_image_url ? (
                  <Image
                    src={featured.cover_image_url}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700" />
                )}
                {featured.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 text-xs font-semibold text-neutral-700 dark:text-neutral-200 backdrop-blur-sm">
                    {featured.category}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="p-5 flex flex-col gap-2 flex-1">
                {featured.published_at && (
                  <p
                    className={c ? undefined : 'text-xs text-neutral-400 dark:text-neutral-500'}
                    style={c ? { color: c, opacity: 0.6, fontSize: '0.75rem' } : undefined}
                  >
                    {formatDate(featured.published_at)}
                  </p>
                )}
                <h3
                  className={`font-heading font-bold text-xl leading-snug group-hover:text-primary-600 transition-colors line-clamp-3 ${c ? '' : 'text-neutral-900 dark:text-neutral-100'}`}
                  style={c ? { color: c } : undefined}
                >
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p
                    className={`text-sm leading-relaxed line-clamp-3 ${c ? '' : 'text-neutral-500 dark:text-neutral-400'}`}
                    style={c ? { color: c, opacity: 0.65 } : undefined}
                  >
                    {featured.excerpt}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Grid posts — right */}
          {gridPosts.length > 0 && (
            <div className="flex flex-col gap-3">
              {gridPosts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  href={`/devotionals/${post.slug}`}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-heading font-semibold text-sm leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 ${c ? '' : 'text-neutral-900 dark:text-neutral-100'}`}
                      style={c ? { color: c } : undefined}
                    >
                      {post.title}
                    </h3>
                    <p
                      className={`text-xs mt-1 ${c ? '' : 'text-neutral-400 dark:text-neutral-500'}`}
                      style={c ? { color: c, opacity: 0.6 } : undefined}
                    >
                      {formatDate(post.published_at)}
                      {post.category && <span className="mx-1.5">·</span>}
                      {post.category}
                    </p>
                    {post.excerpt && (
                      <p
                        className={`text-xs mt-1 leading-relaxed line-clamp-2 ${c ? '' : 'text-neutral-500 dark:text-neutral-400'}`}
                        style={c ? { color: c, opacity: 0.55 } : undefined}
                      >
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button */}
        {cta_text && cta_link && (
          <div className="mt-8 flex justify-center">
            <Link
              href={cta_link}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors"
            >
              {cta_text}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
