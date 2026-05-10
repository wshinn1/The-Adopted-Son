import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import AccountNav from '@/components/account/AccountNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

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
          <AccountNav displayName={profile?.full_name ?? profile?.email ?? 'My Account'} />
          {/* Content */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
