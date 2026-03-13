'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface BlogGallery1Data {
  heading: string
  subheading: string
  post_count: number
  background_color: string
  show_featured_banner: boolean
}

interface Devotional {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
}

interface BlogGallery1Props {
  data: BlogGallery1Data
}

export default function BlogGallery1({ data }: BlogGallery1Props) {
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const [loading, setLoading] = useState(true)

  const count = data.post_count || 3
  const showBanner = data.show_featured_banner !== false

  useEffect(() => {
    const fetchLimit = showBanner ? count + 1 : count
    fetch(`/api/devotionals/recent?limit=${fetchLimit}`)
      .then((r) => r.json())
      .then(({ devotionals: rows }) => {
        setDevotionals(rows || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [count, showBanner])

  const featured = showBanner ? devotionals[0] : null
  const grid = showBanner ? devotionals.slice(1, count + 1) : devotionals.slice(0, count)

  if (loading) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] rounded-xl bg-neutral-200 mb-4" />
              <div className="h-4 bg-neutral-200 rounded mb-2 w-3/4 mx-auto" />
              <div className="h-3 bg-neutral-100 rounded w-1/3 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      className="w-full py-16 px-6 md:px-12 lg:px-24"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      {(data.heading || data.subheading) && (
        <div className="mb-10 text-center">
          {data.heading && (
            <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-2">{data.heading}</h2>
          )}
          {data.subheading && (
            <p className="text-neutral-500 font-body text-base max-w-xl mx-auto">{data.subheading}</p>
          )}
        </div>
      )}

      {/* Featured banner */}
      {featured && showBanner && (
        <Link href={`/devotionals/${featured.slug}`} className="group block mb-8 relative overflow-hidden rounded-2xl">
          <div className="relative w-full aspect-[3/1] min-h-[200px]">
            {featured.cover_image_url ? (
              <Image
                src={featured.cover_image_url}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-neutral-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 max-w-2xl">
            {featured.category && (
              <span className="inline-block bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-3 w-fit">
                {featured.category}
              </span>
            )}
            <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-bold font-heading leading-snug mb-4">
              {featured.title}
            </h3>
            <span className="inline-block bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 w-fit group-hover:bg-primary-700 transition-colors">
              Read More
            </span>
          </div>
        </Link>
      )}

      {/* Card grid */}
      <div className={`grid gap-8 ${count === 2 ? 'md:grid-cols-2' : count >= 3 ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
        {grid.map((post) => {
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null

          return (
            <Link key={post.id} href={`/devotionals/${post.slug}`} className="group block">
              <article>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-neutral-100">
                  {post.cover_image_url ? (
                    <>
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      {post.category && (
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
                          <span className="bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5">
                            {post.category}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 font-heading text-center leading-snug group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>
                {date && (
                  <p className="text-sm text-neutral-400 font-body text-center mt-2">{date}</p>
                )}
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
