'use client'

import Image from 'next/image'
import Link from 'next/link'

export interface FooterNavLink {
  label: string
  url: string
}

export interface FooterNavColumn {
  heading: string
  links: FooterNavLink[]
}

export interface FooterSocialLink {
  platform: string
  url: string
}

export interface FooterImage {
  url: string
  alt?: string
  link?: string
}

export interface FooterConfig {
  bg_color?: string
  text_color?: string
  tagline?: string
  social_links?: FooterSocialLink[]
  nav_columns?: FooterNavColumn[]
  images?: FooterImage[]
  copyright_text?: string
  legal_links?: FooterNavLink[]
  show_on_devotionals?: boolean
  divider_color?: string
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
}

interface BigFooterProps {
  config: FooterConfig
  siteName: string
  logoType?: 'text' | 'image'
  logoUrl?: string
}

export default function BigFooter({ config, siteName, logoType, logoUrl }: BigFooterProps) {
  const {
    bg_color = '#1a1a1a',
    text_color = '#ffffff',
    tagline = '',
    social_links = [],
    nav_columns = [],
    images = [],
    copyright_text = `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
    legal_links = [],
    divider_color = 'rgba(255,255,255,0.1)',
  } = config

  const showImageLogo = logoType === 'image' && logoUrl

  const validImages = images.filter(img => img.url)
  const validNavColumns = nav_columns.filter(col => col.heading || col.links?.length)
  const validSocialLinks = social_links.filter(s => s.platform && s.url)
  const validLegalLinks = legal_links.filter(l => l.label && l.url)

  return (
    <footer style={{ backgroundColor: bg_color, color: text_color }}>
      {/* Main footer body */}
      <div className="px-6 md:px-12 lg:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Column 1: Logo + tagline + social */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="inline-block">
              {showImageLogo ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={160}
                  height={48}
                  className="h-12 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-heading text-2xl font-bold" style={{ color: text_color }}>
                  {siteName.replace(/^["'"']|["'"']$/g, '')}
                </span>
              )}
            </Link>
            {tagline && (
              <p className="text-sm leading-relaxed opacity-70 max-w-xs">{tagline}</p>
            )}
            {validSocialLinks.length > 0 && (
              <div className="flex gap-4 flex-wrap">
                {validSocialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: text_color }}
                    aria-label={s.platform}
                  >
                    {SOCIAL_ICONS[s.platform.toLowerCase()] ?? (
                      <span className="text-xs uppercase">{s.platform}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Nav columns */}
          {validNavColumns.length > 0 && (
            <div className="flex flex-wrap gap-10">
              {validNavColumns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-3 min-w-[120px]">
                  {col.heading && (
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">{col.heading}</h4>
                  )}
                  <ul className="flex flex-col gap-2">
                    {col.links.filter(l => l.label && l.url).map((link, li) => (
                      <li key={li}>
                        <Link
                          href={link.url}
                          className="text-sm opacity-70 hover:opacity-100 transition-opacity hover:underline"
                          style={{ color: text_color }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Column 3: 2×2 image grid */}
          {validImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {validImages.slice(0, 4).map((img, i) => {
                const imgEl = (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-sm bg-neutral-800">
                    <Image
                      src={img.url}
                      alt={img.alt || ''}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  </div>
                )
                return img.link ? (
                  <Link href={img.link} key={i}>{imgEl}</Link>
                ) : (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-sm bg-neutral-800">
                    <Image
                      src={img.url}
                      alt={img.alt || ''}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Copyright bar */}
      <div
        className="px-6 md:px-12 lg:px-24 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50"
        style={{ borderTop: `1px solid ${divider_color}` }}
      >
        <span>{copyright_text}</span>
        {validLegalLinks.length > 0 && (
          <div className="flex gap-4 flex-wrap justify-center sm:justify-end">
            {validLegalLinks.map((l, i) => (
              <Link
                key={i}
                href={l.url}
                className="hover:opacity-100 transition-opacity"
                style={{ color: text_color }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  )
}
