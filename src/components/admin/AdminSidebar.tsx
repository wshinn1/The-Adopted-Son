'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '⊞' },
  { label: 'Pages', href: '/admin/pages', icon: '≡' },
  { label: 'Devotionals', href: '/admin/devotionals', icon: '✝' },
  { label: 'Authors', href: '/admin/authors', icon: '✎' },
  { label: 'Media', href: '/admin/media', icon: '▣' },
  { label: 'Subscribers', href: '/admin/subscribers', icon: '◎' },
  { label: 'Backups', href: '/admin/backups', icon: '↺' },
  { label: 'Site Settings', href: '/admin/site-settings', icon: '⚙' },
]

interface Props {
  user: { name: string; email: string }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-neutral-900 dark:bg-neutral-950 text-white flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-neutral-800">
        <Link href="/" className="text-base font-bold text-white">
          The Adopted Son
        </Link>
        <p className="text-xs text-neutral-400 mt-0.5">Admin</p>
      </div>

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
  )
}
