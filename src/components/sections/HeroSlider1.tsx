'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

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
}

interface HeroSlider1Props {
  data: HeroSlider1Data
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

export default function HeroSlider1({ data }: HeroSlider1Props) {
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
  } = data
  
  // Arrow hover state
  const [isArrowHovered, setIsArrowHovered] = useState(false)
  // Arrow visibility state (for delayed fade-in)
  const [isArrowVisible, setIsArrowVisible] = useState(false)
  
  // Delay the arrow appearing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsArrowVisible(true)
    }, arrow_delay_seconds * 1000)
    
    return () => clearTimeout(timer)
  }, [arrow_delay_seconds])

  // Filter out empty headlines and images
  const validHeadlines = useMemo(() => headlines.filter(h => h && h.trim()), [headlines])
  const validImages = useMemo(() => background_images.filter(img => img && img.trim()), [background_images])

  // Current background image index for crossfade
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Get the daily headline
  const headlineIndex = getDailyHeadlineIndex(validHeadlines.length)
  const currentHeadline = validHeadlines[headlineIndex] || 'Welcome'

  // Debug: Log hero font CSS variables
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    console.log('[v0] HeroSlider1 CSS vars:', {
      fontHero: styles.getPropertyValue('--font-hero'),
      weightHero: styles.getPropertyValue('--font-weight-hero'),
      styleHero: styles.getPropertyValue('--font-style-hero'),
    })
  }, [])

  // Rotate background images
  useEffect(() => {
    if (validImages.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % validImages.length)
    }, image_transition_speed * 1000)
    
    return () => clearInterval(interval)
  }, [validImages.length, image_transition_speed])

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Images with Crossfade */}
      {validImages.map((imageUrl, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: index === currentImageIndex ? 1 : 0,
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
          />
        </div>
      ))}

      {/* Edge blur effect - all four edges */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px 50px rgba(0,0,0,0.3)',
        }}
      />
      
      {/* Additional edge blurs for stronger effect */}
      {/* Top edge */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />
      {/* Bottom edge */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />
      {/* Left edge */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-32 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />
      {/* Right edge */}
      <div 
        className="absolute top-0 bottom-0 right-0 w-32 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />

      {/* Color overlay */}
      <div 
        className="absolute inset-0 z-[2]"
        style={{ 
          backgroundColor: overlay_color,
          opacity: overlay_opacity,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Main Headline */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider whitespace-pre-line"
          style={{ 
            color: text_color,
            fontFamily: 'var(--font-hero)',
            fontWeight: 'var(--font-weight-hero)',
            fontStyle: 'var(--font-style-hero)',
          }}
        >
          {currentHeadline}
        </h1>

        {/* Optional Subheadline */}
        {show_subheadline && subheadline && (
          <p 
            className="mt-6 text-lg md:text-xl lg:text-2xl font-body max-w-3xl mx-auto leading-relaxed"
            style={{ color: text_color, opacity: 0.9 }}
          >
            {subheadline}
          </p>
        )}

        {/* Scroll Down Arrow with Glass Effect and Delayed Fade-in */}
        <button
          onClick={() => {
            // Find the next sibling section and scroll to it
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

      {/* Image indicators */}
      {validImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
