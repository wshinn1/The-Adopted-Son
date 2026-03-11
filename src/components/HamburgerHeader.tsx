'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

interface NavLink {
  label: string
  url: string
}

interface HamburgerHeaderProps {
  siteName: string
  logoType?: 'text' | 'image'
  logoUrl?: string
  navLinks: NavLink[]
}

export default function HamburgerHeader({ siteName, logoType = 'text', logoUrl, navLinks }: HamburgerHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Determine if we should show image: only if logoType is 'image' AND logoUrl exists
  const showImageLogo = logoType === 'image' && logoUrl

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-24 bg-white/80 backdrop-blur-sm">
        {/* Logo / Site Name */}
        <Link href="/" className="text-lg font-medium text-neutral-900">
          {showImageLogo ? (
            <Image 
              src={logoUrl} 
              alt={siteName} 
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              unoptimized={logoUrl.includes('blob.vercel-storage.com')}
            />
          ) : (
            <span className="font-heading text-xl font-semibold">{siteName}</span>
          )}
        </Link>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex size-10 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-600"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* Full-screen Overlay Menu */}
      <div
        className={`fixed inset-0 z-[100] bg-white transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-6 top-4 flex size-10 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-600 md:right-12 lg:right-24"
          aria-label="Close menu"
        >
          <X className="size-6" />
        </button>

        {/* Navigation Links */}
        <nav className="flex h-full flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-medium text-neutral-900 transition-colors hover:text-neutral-500 md:text-4xl lg:text-5xl font-heading"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
