'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavLink {
  label: string
  url: string
  bg_color?: string
  text_color?: string
}

export interface NavTypography {
  fontClass?: string        // e.g. 'font-heading', 'font-sans', 'font-serif'
  fontWeight?: string       // CSS font-weight: '300','400','500','600','700'
  fontSize?: string         // px string e.g. '14'
  letterSpacing?: string    // 'normal','wide','wider','widest'
  textTransform?: string    // 'none','uppercase','capitalize','lowercase'
}

export interface NavScroll {
  initialOpacity?: number   // 0–100, bg opacity at page top
  scrolledOpacity?: number  // 0–100, bg opacity when scrolled
  blurAmount?: number       // 0–20px blur when scrolled
}

interface HamburgerHeaderProps {
  siteName: string
  logoType?: 'text' | 'image'
  logoUrl?: string
  navLinks: NavLink[]
  navTypography?: NavTypography
  navScroll?: NavScroll
}

const TRACKING: Record<string, string> = {
  normal: '0em',
  wide: '0.05em',
  wider: '0.1em',
  widest: '0.2em',
}

export default function HamburgerHeader({
  siteName,
  logoType = 'text',
  logoUrl,
  navLinks,
  navTypography = {},
  navScroll = {},
}: HamburgerHeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  const {
    fontClass = '',
    fontWeight = '500',
    fontSize = '14',
    letterSpacing = 'normal',
    textTransform = 'none',
  } = navTypography

  const {
    initialOpacity = 0,
    scrolledOpacity = 90,
    blurAmount = 12,
  } = navScroll

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const showImageLogo = logoType === 'image' && logoUrl

  // Split links: last link with bg_color is treated as a CTA button on desktop
  const ctaIndex = (() => {
    for (let i = navLinks.length - 1; i >= 0; i--) {
      if (navLinks[i].bg_color) return i
    }
    return -1
  })()
  const regularLinks = navLinks.filter((_, i) => i !== ctaIndex)
  const ctaLink = ctaIndex >= 0 ? navLinks[ctaIndex] : null

  const linkTypographyStyle: React.CSSProperties = {
    fontWeight,
    fontSize: `${fontSize}px`,
    letterSpacing: TRACKING[letterSpacing] ?? letterSpacing,
    textTransform: textTransform as any,
  }

  // Background style that changes on scroll
  const bgOpacity = isScrolled ? scrolledOpacity / 100 : initialOpacity / 100
  const headerStyle: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${bgOpacity})`,
    backdropFilter: isScrolled && blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
    WebkitBackdropFilter: isScrolled && blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
    transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
  }

  return (
    <>
      {/* ── HEADER ── */}
      <header
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 lg:px-16"
        style={headerStyle}
      >
        {/* Logo */}
        <Link href="/" className="shrink-0">
          {showImageLogo ? (
            <Image
              src={logoUrl!}
              alt={siteName}
              width={160}
              height={40}
              className="h-9 w-auto object-contain"
              unoptimized={logoUrl!.includes('blob.vercel-storage.com')}
            />
          ) : (
            <span className="font-heading text-xl font-semibold text-neutral-900">
              {siteName.replace(/^["'"']|["'"']$/g, '')}
            </span>
          )}
        </Link>

        {/* ── DESKTOP NAV ── hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-6">
          {regularLinks.map((link, i) => (
            <Link
              key={i}
              href={link.url}
              className={`text-neutral-700 hover:text-neutral-900 transition-colors ${fontClass}`}
              style={linkTypographyStyle}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── DESKTOP CTA + right side ── */}
        <div className="hidden lg:flex items-center gap-4">
          {ctaLink && (
            <Link
              href={ctaLink.url}
              className={`inline-flex items-center px-5 py-2 rounded-full transition-opacity hover:opacity-80 ${fontClass}`}
              style={{
                backgroundColor: ctaLink.bg_color!,
                color: ctaLink.text_color || '#fff',
                ...linkTypographyStyle,
              }}
            >
              {ctaLink.label}
            </Link>
          )}
        </div>

        {/* ── MOBILE: hamburger button ── visible on mobile only */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex size-10 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-600 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* ── MOBILE FULLSCREEN OVERLAY ── */}
      <div
        className={`fixed inset-0 z-[100] bg-white transition-transform duration-500 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-6 top-4 flex size-10 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-600 md:right-12"
          aria-label="Close menu"
        >
          <X className="size-6" />
        </button>

        <nav className="flex h-full flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-medium transition-colors md:text-4xl font-heading"
              style={link.bg_color ? {
                backgroundColor: link.bg_color,
                color: link.text_color || '#000',
                paddingLeft: '0.75em',
                paddingRight: '0.75em',
                paddingTop: '0.25em',
                paddingBottom: '0.25em',
                borderRadius: '9999px',
              } : { color: 'rgb(23,23,23)' }}
            >
              {link.label}
            </Link>
          ))}

          {!loading && (
            user ? (
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-medium text-neutral-900 hover:text-neutral-500 md:text-4xl font-heading flex items-center gap-3"
              >
                <User className="size-8" />
                Account
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="text-3xl font-medium text-neutral-900 hover:text-neutral-500 md:text-4xl font-heading"
              >
                Login
              </Link>
            )
          )}
        </nav>
      </div>
    </>
  )
}
