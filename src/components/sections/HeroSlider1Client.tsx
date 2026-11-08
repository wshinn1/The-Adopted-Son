'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import BlurText from '@/components/ui/blur-text'
import { useSplashComplete } from '@/components/SplashContext'

export interface HeroSlider1Data {
  // Headlines - up to 20, rotates daily at 12:30 AM EST
  headlines: string[]
  // Subheadline (optional, default off)
  show_subheadline: boolean
  subheadline: string
  // Background images - up to 5, fades between them
  background_images: string[]
  // Styling
  text_color: string
  overlay_color: string
  overlay_opacity: number
  // Image transition speed in seconds
  image_transition_speed: number
  // Scroll arrow colors
  arrow_color: string
  arrow_hover_color: string
  // Arrow glass effect
  arrow_glass_opacity: number
  arrow_glass_blur: number
  arrow_delay_seconds: number
  // Text animation settings
  text_animation_duration: number
  text_animation_stagger: number
  text_animation_blur: number
  // Subheadline animation settings
  subheadline_animation_delay: number
  subheadline_animation_speed: number
  subheadline_animation_blur: number
  // Devotional selection
  selected_slider_devotional_ids?: string[]
  selected_grid_devotional_ids?: string[]
  // Card row below slider
  card_title_color?: string
  card_date_color?: string
  card_excerpt_color?: string
  // Editorial header (shown above slider in devotional mode)
  show_editorial_header?: boolean
  editorial_label?: string
  editorial_heading?: string
  editorial_description?: string
  show_newsletter?: boolean
  show_newsletter_name_field?: boolean
  newsletter_name_placeholder?: string
  newsletter_button_text?: string
  newsletter_placeholder?: string
}

export interface SliderDevo {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
}

interface HeroSlider1ClientProps {
  data: HeroSlider1Data
  sliderDevotionals?: SliderDevo[]
  gridDevotionals?: SliderDevo[]
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get the headline index based on the current date (resets at 12:30 AM EST)
function getDailyHeadlineIndex(totalHeadlines: number): number {
  if (totalHeadlines === 0) return 0
  
  // Get current time in EST
  const now = new Date()
  const estOffset = -5 * 60 // EST is UTC-5
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const estTime = new Date(utc + (estOffset * 60000))
  
  // If before 12:30 AM, use previous day
  const hours = estTime.getHours()
  const minutes = estTime.getMinutes()
  if (hours === 0 && minutes < 30) {
    estTime.setDate(estTime.getDate() - 1)
  }
  
  // Use day of year as seed for rotation
  const start = new Date(estTime.getFullYear(), 0, 0)
  const diff = estTime.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  
  return dayOfYear % totalHeadlines
}

export default function HeroSlider1Client({ data, sliderDevotionals = [], gridDevotionals = [] }: HeroSlider1ClientProps) {
  const {
    headlines = [],
    show_subheadline = false,
    subheadline = '',
    background_images = [],
    text_color = '#ffffff',
    overlay_color = '#000000',
    overlay_opacity = 0.3,
    image_transition_speed = 8,
    arrow_color = '#ffffff',
    arrow_hover_color = '#FFB84D',
    arrow_glass_opacity = 0.2,
    arrow_glass_blur = 10,
    arrow_delay_seconds = 2,
    text_animation_duration = 0.5,
    text_animation_stagger = 0.1,
    text_animation_blur = 10,
    subheadline_animation_delay = 1.5,
    subheadline_animation_speed = 0.35,
    subheadline_animation_blur = 10,
    card_title_color = '',
    card_date_color = '',
    card_excerpt_color = '',
    show_editorial_header = false,
    editorial_label = '',
    editorial_heading = '',
    editorial_description = '',
    show_newsletter = false,
    show_newsletter_name_field = false,
    newsletter_name_placeholder = 'First name',
    newsletter_button_text = 'Subscribe',
    newsletter_placeholder = 'Enter your email',
  } = data
  
  // Check if splash screen is complete
  const isSplashComplete = useSplashComplete()
  // Track if animations should start
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterFirstName, setNewsletterFirstName] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterStatus('loading')
    try {
      // Use entered first name if available, otherwise derive from email prefix
      const derivedName = newsletterEmail.split('@')[0].split(/[._-]/)[0]
      const firstName = newsletterFirstName.trim() || (derivedName.charAt(0).toUpperCase() + derivedName.slice(1))
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email: newsletterEmail }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setNewsletterStatus('sent')
      } else {
        throw new Error(json.error || 'Subscribe failed')
      }
    } catch {
      setNewsletterStatus('error')
    }
  }

  // Arrow hover state
  const [isArrowHovered, setIsArrowHovered] = useState(false)
  // Arrow visibility state (for delayed fade-in)
  const [isArrowVisible, setIsArrowVisible] = useState(false)
  // Track if initial image has loaded
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false)
  
  // Start animations only after splash is complete
  useEffect(() => {
    if (isSplashComplete) {
      // Small delay to let the page settle
      const timer = setTimeout(() => {
        setShouldAnimate(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isSplashComplete])
  
  // Delay the arrow appearing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsArrowVisible(true)
    }, arrow_delay_seconds * 1000)
    
    return () => clearTimeout(timer)
  }, [arrow_delay_seconds])

  // Filter out empty headlines and images
  const validHeadlines = useMemo(() => headlines.filter(h => h && h.trim()), [headlines])
  const staticImages = useMemo(() => background_images.filter(img => img && img.trim()), [background_images])

  // When devotionals are chosen for the slider, use them as slides
  const useDevotionalSlider = sliderDevotionals.length > 0

  // Build the final slide list: devotional slides OR static images
  const slideImages = useDevotionalSlider
    ? sliderDevotionals.map(d => d.cover_image_url ?? '')
    : staticImages

  // Current background image index for crossfade
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Headline: for devotional slides it's the devotional title; otherwise daily rotation
  const headlineIndex = getDailyHeadlineIndex(validHeadlines.length)
  const currentHeadline = useDevotionalSlider
    ? sliderDevotionals[currentImageIndex]?.title ?? ''
    : (validHeadlines[headlineIndex] || 'Welcome')

  const currentDevo = useDevotionalSlider ? sliderDevotionals[currentImageIndex] : null

  // Rotate slides
  useEffect(() => {
    if (slideImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % slideImages.length)
    }, image_transition_speed * 1000)

    return () => clearInterval(interval)
  }, [slideImages.length, image_transition_speed])

  // ── Devotional slider mode: editorial compact layout ────────────────────────
  if (useDevotionalSlider) {
    const prev = () => setCurrentImageIndex(c => (c - 1 + sliderDevotionals.length) % sliderDevotionals.length)
    const next = () => setCurrentImageIndex(c => (c + 1) % sliderDevotionals.length)

    return (
      <div className="w-full py-6 md:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Editorial header above slider */}
          {show_editorial_header && (editorial_heading || show_newsletter) && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {editorial_label && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{editorial_label}</p>
                )}
                {editorial_heading && (
                  <h2 className="font-heading font-black text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100 leading-tight text-balance">
                    {editorial_heading}
                  </h2>
                )}
              </div>
              {show_newsletter && (
                <div className="sm:max-w-xs w-full sm:pt-1">
                  {editorial_description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">{editorial_description}</p>
                  )}
                  {newsletterStatus === 'sent' ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">You&apos;re subscribed!</p>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                      {show_newsletter_name_field && (
                        <input
                          type="text"
                          value={newsletterFirstName}
                          onChange={e => setNewsletterFirstName(e.target.value)}
                          placeholder={newsletter_name_placeholder}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                        />
                      )}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={newsletterEmail}
                          onChange={e => setNewsletterEmail(e.target.value)}
                          placeholder={newsletter_placeholder}
                          className="flex-1 min-w-0 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                        />
                        <button
                          type="submit"
                          disabled={newsletterStatus === 'loading'}
                          className="shrink-0 px-4 py-2 text-sm font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50"
                        >
                          {newsletterStatus === 'loading' ? '…' : newsletter_button_text}
                        </button>
                      </div>
                    </form>
                  )}
                  {newsletterStatus === 'error' && (
                    <p className="mt-1 text-xs text-red-500">Something went wrong. Please try again.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compact editorial slider */}
          <div className="relative overflow-hidden rounded-2xl" style={{ height: '460px' }}>
            {/* Crossfade background images */}
            {sliderDevotionals.map((d, i) => (
              <div
                key={d.id}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === currentImageIndex && isFirstImageLoaded ? 1 : 0, zIndex: 0 }}
              >
                {d.cover_image_url ? (
                  <Image
                    src={d.cover_image_url}
                    alt={d.title}
                    fill
                    priority={i === 0}
                    className="object-cover"
                    unoptimized
                    onLoad={() => { if (i === 0) setIsFirstImageLoaded(true) }}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800" />
                )}
              </div>
            ))}

            {/* Bottom gradient */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }}
            />

            {/* Category badge */}
            {currentDevo?.category && (
              <div className="absolute top-5 left-5 z-20">
                <span className="inline-block bg-white text-neutral-900 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                  {currentDevo.category}
                </span>
              </div>
            )}

            {/* Prev / Next arrows */}
            {sliderDevotionals.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                  aria-label="Next"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {/* Text — bottom left */}
            <Link
              href={`/devotionals/${currentDevo?.slug ?? ''}`}
              className="absolute bottom-0 left-0 right-0 z-20 px-7 pb-10 md:px-10 md:pb-12 max-w-2xl group"
            >
              {currentDevo?.published_at && (
                <p className="text-white/60 text-sm mb-1.5">{formatDate(currentDevo.published_at)}</p>
              )}
              <h2 className="text-white font-heading font-bold text-2xl md:text-3xl leading-tight text-balance group-hover:underline underline-offset-4 decoration-white/40">
                {currentDevo?.title}
              </h2>
              {currentDevo?.excerpt && (
                <p className="mt-2 text-white/75 text-sm md:text-base leading-relaxed line-clamp-2">
                  {currentDevo.excerpt}
                </p>
              )}
            </Link>

            {/* Dot indicators */}
            {sliderDevotionals.length > 1 && (
              <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
                {sliderDevotionals.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Horizontal card list below slider */}
          {gridDevotionals.length > 0 && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {gridDevotionals.map((post) => (
                <Link key={post.id} href={`/devotionals/${post.slug}`} className="group flex items-start gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl hover:shadow-sm transition-shadow">
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                    {post.cover_image_url ? (
                      <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-heading font-bold text-sm leading-snug line-clamp-2 ${card_title_color ? 'group-hover:opacity-75 transition-opacity' : 'text-neutral-900 dark:text-neutral-100 group-hover:text-title-hover transition-colors'}`}
                      style={card_title_color ? { color: card_title_color } : undefined}
                    >
                      {post.title}
                    </h3>
                    {post.published_at && (() => {
                      const dc = card_date_color || (card_title_color ? undefined : null)
                      const useFallback = !card_date_color && card_title_color
                      return (
                        <p
                          className={`mt-0.5 text-xs ${!card_date_color && !card_title_color ? 'text-neutral-500 dark:text-neutral-400' : ''}`}
                          style={
                            card_date_color ? { color: card_date_color }
                            : useFallback ? { color: card_title_color, opacity: 0.65 }
                            : undefined
                          }
                        >
                          {formatDate(post.published_at)}
                        </p>
                      )
                    })()}
                    {post.excerpt && (() => {
                      const useFallback = !card_excerpt_color && card_title_color
                      return (
                        <p
                          className={`mt-1 text-xs leading-relaxed line-clamp-2 ${!card_excerpt_color && !card_title_color ? 'text-neutral-400 dark:text-neutral-500' : ''}`}
                          style={
                            card_excerpt_color ? { color: card_excerpt_color }
                            : useFallback ? { color: card_title_color, opacity: 0.55 }
                            : undefined
                          }
                        >
                          {post.excerpt}
                        </p>
                      )
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Static hero mode (no devotionals selected) ───────────────────────────────
  return (
    <>
    <section
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: overlay_color }}
    >
      {/* Background Images with Crossfade */}
      {staticImages.map((imageUrl, index) => (
        <div
          key={`${imageUrl}-${index}`}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === currentImageIndex && isFirstImageLoaded ? 1 : 0,
            zIndex: 0,
          }}
        >
          <Image
            src={imageUrl}
            alt={`Background ${index + 1}`}
            fill
            priority={index === 0}
            className="object-cover"
            unoptimized={imageUrl.includes('blob.vercel-storage.com')}
            onLoad={() => { if (index === 0) setIsFirstImageLoaded(true) }}
          />
        </div>
      ))}

      {/* Edge blur effect */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ boxShadow: 'inset 0 0 100px 50px rgba(0,0,0,0.3)' }} />
      <div className="absolute top-0 left-0 right-0 h-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
      <div className="absolute top-0 bottom-0 left-0 w-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
      <div className="absolute top-0 bottom-0 right-0 w-32 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />

      {/* Color overlay */}
      <div className="absolute inset-0 z-[2]" style={{ backgroundColor: overlay_color, opacity: overlay_opacity }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {shouldAnimate ? (
          <TextGenerateEffect
            key={currentHeadline}
            words={currentHeadline}
            className="uppercase tracking-wider"
            filter={true}
            duration={text_animation_duration}
            staggerDelay={text_animation_stagger}
            blurAmount={text_animation_blur}
            style={{
              color: text_color,
              fontFamily: 'var(--font-hero)',
              fontWeight: 'var(--font-weight-hero)',
              fontStyle: 'var(--font-style-hero)',
              fontSize: 'clamp(2rem, 5vw, var(--font-size-hero, 3.5rem))',
            }}
          />
        ) : (
          <div
            className="uppercase tracking-wider opacity-0"
            style={{
              color: text_color,
              fontFamily: 'var(--font-hero)',
              fontWeight: 'var(--font-weight-hero)',
              fontStyle: 'var(--font-style-hero)',
              fontSize: 'clamp(2rem, 5vw, var(--font-size-hero, 3.5rem))',
            }}
          >
            {currentHeadline}
          </div>
        )}

        {show_subheadline && subheadline && shouldAnimate && (
          <BlurText
            key={subheadline}
            text={subheadline}
            className="mt-6 text-lg md:text-xl lg:text-2xl font-body max-w-3xl mx-auto leading-relaxed justify-center"
            animateBy="words"
            direction="bottom"
            stepDuration={subheadline_animation_speed}
            blurAmount={subheadline_animation_blur}
            initialDelay={subheadline_animation_delay}
            style={{ color: text_color, opacity: 0.9 }}
          />
        )}

        {/* Scroll Down Arrow */}
        <button
          onClick={() => {
            const heroSection = document.querySelector('section')
            if (heroSection?.nextElementSibling) {
              heroSection.nextElementSibling.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          onMouseEnter={() => setIsArrowHovered(true)}
          onMouseLeave={() => setIsArrowHovered(false)}
          className="mt-12 inline-flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-700 hover:scale-110"
          style={{
            borderColor: isArrowHovered ? arrow_hover_color : arrow_color,
            color: isArrowHovered ? arrow_hover_color : arrow_color,
            backgroundColor: `rgba(255, 255, 255, ${arrow_glass_opacity})`,
            backdropFilter: `blur(${arrow_glass_blur}px)`,
            WebkitBackdropFilter: `blur(${arrow_glass_blur}px)`,
            opacity: isArrowVisible ? 1 : 0,
            transform: isArrowVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
          aria-label="Scroll to next section"
        >
          <ChevronDown className="size-7" />
        </button>
      </div>

      {/* Slide indicators */}
      {staticImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {staticImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
    </>
  )
}
