'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '⊞' },
  { label: 'Pages', href: '/admin/pages', icon: '≡' },
  { label: 'Devotionals', href: '/admin/devotionals', icon: '✝' },
  { label: 'Authors', href: '/admin/authors', icon: '✎' },
  { label: 'Media', href: '/admin/media', icon: '▣' },
  { label: 'Subscribers', href: '/admin/subscribers', icon: '◎' },
  { label: 'Popup', href: '/admin/popup', icon: '◫' },
  { label: 'Analytics', href: '/admin/analytics', icon: '↗' },
  { label: 'Backups', href: '/admin/backups', icon: '↺' },
  { label: 'Menu', href: '/admin/menu', icon: '☰' },
  { label: 'Typography', href: '/admin/typography', icon: 'Aa' },
  { label: 'Blog Settings', href: '/admin/blog-settings', icon: '✉' },
  { label: 'Site Settings', href: '/admin/site-settings', icon: '⚙' },
]

interface Props {
  user: { name: string; email: string }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-neutral-900 dark:bg-neutral-950 text-white px-4 py-3 flex items-center justify-between border-b border-neutral-800">
        <Link href="/" className="text-base font-bold text-white">
          The Adopted Son
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, visible on lg+ OR when mobileOpen */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-60 shrink-0 bg-neutral-900 dark:bg-neutral-950 text-white flex flex-col min-h-screen
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:transform-none
        `}
      >
        {/* Brand - hidden on mobile (shown in header bar instead) */}
        <div className="hidden lg:block px-5 py-5 border-b border-neutral-800">
          <Link href="/" className="text-base font-bold text-white">
            The Adopted Son
          </Link>
          <p className="text-xs text-neutral-400 mt-0.5">Admin</p>
        </div>

        {/* Mobile spacer for the fixed header */}
        <div className="lg:hidden h-14" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="text-xs font-medium text-neutral-300 truncate">{user.name}</p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
