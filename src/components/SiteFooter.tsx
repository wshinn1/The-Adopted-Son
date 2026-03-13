'use client'

import Link from 'next/link'
import { ArrowUp } from 'lucide-react'

interface FooterLink {
  label: string
  url: string
}

interface SiteFooterProps {
  footerText: string
  footerLinks: FooterLink[]
}

export default function SiteFooter({ footerText, footerLinks }: SiteFooterProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="relative border-t border-neutral-200 bg-white py-6 px-6 md:px-12 lg:px-24">
      <div className="flex flex-col items-center gap-3">
        {/* Footer links */}
        {footerLinks.length > 0 && (
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {footerLinks.map((link, i) => (
              <Link
                key={i}
                href={link.url}
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Copyright */}
        <p className="text-sm text-neutral-500">
          {footerText || `Copyright © ${new Date().getFullYear()} The Adopted Son`}
        </p>
      </div>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="absolute right-6 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors md:right-12"
      >
        <ArrowUp className="size-5" />
      </button>
    </footer>
  )
}
