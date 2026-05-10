'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'My Account', href: '/account' },
  { label: 'Giving History', href: '/account/billing' },
  { label: 'Profile', href: '/account/profile' },
]

export default function AccountNav({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {displayName}
        </p>
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/account'
          ? pathname === '/account'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
