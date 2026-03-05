import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, subscription_status, subscription_plan, subscription_period_end')
    .eq('id', user.id)
    .single()

  const isActive =
    profile?.subscription_status === 'active' &&
    profile?.subscription_period_end &&
    new Date(profile.subscription_period_end) > new Date()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
        <div className="container flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            The Adopted Son
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar */}
          <nav className="space-y-1">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {profile?.full_name ?? profile?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-neutral-400'}`} />
                <span className="text-xs text-neutral-500">
                  {isActive ? `${profile?.subscription_plan ?? 'Active'} subscriber` : 'Free trial'}
                </span>
              </div>
            </div>
            {[
              { label: 'My Devotionals', href: '/account' },
              { label: 'Billing', href: '/account/billing' },
              { label: 'Profile', href: '/account/profile' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Content */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
