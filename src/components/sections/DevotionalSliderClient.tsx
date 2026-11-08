'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SliderDevotional {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
}

interface DevotionalSliderClientProps {
  sliderDevotionals: SliderDevotional[]
  remainingDevotionals: SliderDevotional[]
  slideDuration: number
  backgroundColor: string
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DevotionalSliderClient({
  sliderDevotionals,
  remainingDevotionals,
  slideDuration,
  backgroundColor,
}: DevotionalSliderClientProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = sliderDevotionals.length

  const prev = useCallback(() => setCurrent(c => (c - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count])

  useEffect(() => {
    if (count <= 1 || paused) return
    const interval = setInterval(next, slideDuration * 1000)
    return () => clearInterval(interval)
  }, [count, slideDuration, paused, next])

  if (count === 0) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 text-center text-neutral-400 text-sm"
        style={{ backgroundColor }}>
        No devotionals selected for slider.
      </section>
    )
  }

  const slide = sliderDevotionals[current]

  return (
    <section style={{ backgroundColor }}>
      {/* ── Slider ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ minHeight: '65vh' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background images — crossfade */}
        {sliderDevotionals.map((d, i) => (
          <div
            key={d.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: 0 }}
          >
            {d.cover_image_url ? (
              <Image
                src={d.cover_image_url}
                alt={d.title}
                fill
                className="object-cover"
                priority={i === 0}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-neutral-800" />
            )}
          </div>
        ))}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)' }} />

        {/* Category badge */}
        {slide.category && (
          <div className="absolute top-6 left-6 z-20">
            <span className="inline-block bg-white text-neutral-900 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
              {slide.category}
            </span>
          </div>
        )}

        {/* Text content */}
        <Link
          href={`/devotionals/${slide.slug}`}
          className="absolute bottom-0 left-0 right-0 z-20 px-8 pb-12 md:px-14 md:pb-14 max-w-2xl group"
        >
          {slide.published_at && (
            <p className="text-white/60 text-sm mb-2">{formatDate(slide.published_at)}</p>
          )}
          <h2 className="text-white font-heading font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance group-hover:underline underline-offset-4 decoration-white/40">
            {slide.title}
          </h2>
          {slide.excerpt && (
            <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed line-clamp-2">
              {slide.excerpt}
            </p>
          )}
        </Link>

        {/* Prev/Next arrows */}
        {count > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
              aria-label="Previous devotional"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
              aria-label="Next devotional"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {sliderDevotionals.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Remaining devotionals grid ── */}
      {remainingDevotionals.length > 0 && (
        <div className="px-6 md:px-12 lg:px-24 pt-10 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingDevotionals.map((post) => (
              <Link key={post.id} href={`/devotionals/${post.slug}`} className="group block">
                <article>
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-100">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200" />
                    )}
                  </div>
                  <div className="pt-4">
                    {post.published_at && (
                      <p className="text-xs text-neutral-400 mb-1">{formatDate(post.published_at)}</p>
                    )}
                    <h3 className="font-heading font-bold text-neutral-900 dark:text-neutral-100 leading-snug text-balance group-hover:text-title-hover transition-colors">
                      {post.title}
                    </h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
