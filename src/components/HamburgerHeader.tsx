'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface NavLink {
  label: string
  url: string
}

interface HamburgerHeaderProps {
  siteName: string
  logoUrl?: string
  navLinks: NavLink[]
}

export default function HamburgerHeader({ siteName, logoUrl, navLinks }: HamburgerHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-24">
        {/* Logo / Site Name */}
        <Link href="/" className="text-lg font-medium text-neutral-900">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
          ) : (
            siteName
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
              className="text-3xl font-medium text-neutral-900 transition-colors hover:text-neutral-500 md:text-4xl lg:text-5xl"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
