'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react'

export interface FooterSocialLink {
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'linkedin'
  url: string
}

export interface FooterNavLink {
  label: string
  url: string
}

export interface FooterNavColumn {
  title: string
  title_color?: string
  links: FooterNavLink[]
  link_color?: string
}

export interface FooterImage {
  url: string
  alt: string
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

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
}

interface BigFooterProps {
  config: FooterConfig
  siteName: string
  logoType?: 'text' | 'image'
  logoUrl?: string
}

export default function BigFooter({ config, siteName, logoType, logoUrl }: BigFooterProps) {
  const {
    bg_color = '#ffffff',
    text_color = '#1a1a1a',
    tagline = '',
    social_links = [],
    nav_columns = [],
    images = [],
    copyright_text = '',
    legal_links = [],
    divider_color = '#e5e7eb',
  } = config

  const showImageLogo = logoType === 'image' && logoUrl
  const year = new Date().getFullYear()
  const copyrightFinal = copyright_text || `© ${year} — ${siteName}. All rights reserved.`

  return (
    <footer className="border-t" style={{ backgroundColor: bg_color, color: text_color, borderColor: divider_color }}>
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_auto_auto_auto]">

          {/* ── Left: Logo + tagline + social ── */}
          <div className="flex flex-col gap-5 max-w-xs">
            <Link href="/" className="inline-block">
              {showImageLogo ? (
                <Image
                  src={logoUrl!}
                  alt={siteName}
                  width={140}
                  height={36}
                  className="h-9 w-auto object-contain"
                  unoptimized={logoUrl!.includes('blob.vercel-storage.com')}
                />
              ) : (
                <span className="font-heading text-xl font-semibold" style={{ color: text_color }}>
                  {siteName.replace(/^["'"']|["'"']$/g, '')}
                </span>
              )}
            </Link>

            {tagline && (
              <p className="text-sm leading-relaxed" style={{ color: text_color, opacity: 0.7 }}>
                {tagline}
              </p>
            )}

            {social_links.length > 0 && (
              <div className="flex items-center gap-3 mt-1">
                {social_links.map((s, i) => {
                  const Icon = SOCIAL_ICONS[s.platform]
                  if (!Icon || !s.url) return null
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-9 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
                      style={{ backgroundColor: text_color, color: bg_color }}
                      aria-label={s.platform}
                    >
                      <Icon className="size-4" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Nav columns ── */}
          {nav_columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-4 min-w-[120px]">
              {col.title && (
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: col.title_color || text_color, opacity: col.title_color ? 1 : 0.5 }}
                >
                  {col.title}
                </span>
              )}
              <nav className="flex flex-col gap-2">
                {col.links.map((link, li) => (
                  <Link
                    key={li}
                    href={link.url}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ color: col.link_color || text_color }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* ── Image grid ── */}
          {images.some(img => img.url) && (
            <div className="grid grid-cols-2 gap-2 w-[280px] self-start">
              {images.slice(0, 4).map((img, i) => (
                img.url ? (
                  <div key={i} className="aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-100">
                    <Image
                      src={img.url}
                      alt={img.alt || ''}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div key={i} className="aspect-[4/3] rounded-lg bg-neutral-100" />
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Copyright bar ── */}
      <div
        className="border-t"
        style={{ borderColor: divider_color }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm" style={{ color: text_color, opacity: 0.6 }}>
            {copyrightFinal}
          </p>
          {legal_links.length > 0 && (
            <nav className="flex items-center gap-6">
              {legal_links.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: text_color, opacity: 0.6 }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}
