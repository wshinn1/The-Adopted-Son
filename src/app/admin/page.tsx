import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ count: devotionalCount }, { count: subscriberCount }, { data: recentDevotionals }] =
    await Promise.all([
      supabase.from('devotionals').select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active'),
      supabase
        .from('devotionals')
        .select('id, title, slug, is_published, is_premium, published_at, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const stats = [
    { label: 'Total Devotionals', value: devotionalCount ?? 0, href: '/admin/devotionals' },
    { label: 'Active Subscribers', value: subscriberCount ?? 0, href: '/admin/subscribers' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <Link
          href="/admin/devotionals/new"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          + New Devotional
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent devotionals */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Recent Devotionals</h2>
          <Link href="/admin/devotionals" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {recentDevotionals?.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {d.title}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {d.published_at
                    ? new Date(d.published_at).toLocaleDateString()
                    : 'Draft'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.is_published
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {d.is_published ? 'Published' : 'Draft'}
                </span>
                <Link
                  href={`/admin/devotionals/${d.id}/edit`}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {(!recentDevotionals || recentDevotionals.length === 0) && (
            <div className="px-6 py-8 text-center text-sm text-neutral-400">
              No devotionals yet.{' '}
              <Link href="/admin/devotionals/new" className="text-primary-600">
                Create your first one
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
