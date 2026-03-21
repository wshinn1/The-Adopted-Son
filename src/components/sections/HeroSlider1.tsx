'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export interface HeroSlider1Data {
  // Headlines - up to 20, rotates daily at 12:30 AM EST
  headlines: string[]
  // Subtitle (optional, default off)
  show_subtitle: boolean
  subtitle: string
  // Background images - up to 5, fades between them
  background_images: string[]
  // Styling
  text_color: string
  overlay_opacity: number
  // Image transition speed in seconds
  image_transition_speed: number
  // Scroll arrow colors
  arrow_color: string
  arrow_hover_color: string
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
    show_subtitle = false,
    subtitle = '',
    background_images = [],
    text_color = '#ffffff',
    overlay_opacity = 0.3,
    image_transition_speed = 8,
    arrow_color = '#ffffff',
    arrow_hover_color = '#FFB84D',
  } = data
  
  // Arrow hover state
  const [isArrowHovered, setIsArrowHovered] = useState(false)

  // Filter out empty headlines and images
  const validHeadlines = useMemo(() => headlines.filter(h => h && h.trim()), [headlines])
  const validImages = useMemo(() => background_images.filter(img => img && img.trim()), [background_images])

  // Current background image index for crossfade
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Get the daily headline
  const headlineIndex = getDailyHeadlineIndex(validHeadlines.length)
  const currentHeadline = validHeadlines[headlineIndex] || 'Welcome'

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

      {/* Dark overlay */}
      <div 
        className="absolute inset-0 z-[2]"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlay_opacity})` }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Main Headline */}
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider font-heading"
          style={{ color: text_color }}
        >
          {currentHeadline}
        </h1>

        {/* Optional Subtitle */}
        {show_subtitle && subtitle && (
          <p 
            className="mt-6 text-lg md:text-xl lg:text-2xl font-body max-w-3xl mx-auto leading-relaxed"
            style={{ color: text_color, opacity: 0.9 }}
          >
            {subtitle}
          </p>
        )}

        {/* Scroll Down Arrow */}
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
          className="mt-12 inline-flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 hover:scale-110"
          style={{
            borderColor: isArrowHovered ? arrow_hover_color : arrow_color,
            color: isArrowHovered ? arrow_hover_color : arrow_color,
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
