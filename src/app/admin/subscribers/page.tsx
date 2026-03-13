import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import NewsletterSubscribersTable from '@/components/admin/NewsletterSubscribersTable'

export const metadata: Metadata = { title: 'Subscribers — Admin' }

export default async function AdminSubscribersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Newsletter subscribers
  const { data: newsletterSubscribers } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, first_name, subscribed_at, is_active')
    .order('subscribed_at', { ascending: false })

  const { data: subscribers } = await supabase
    .from('profiles')
    .select('id, email, full_name, subscription_status, subscription_plan, subscription_period_end, created_at')
    .not('subscription_status', 'eq', 'inactive')
    .order('created_at', { ascending: false })

  const { data: trials } = await supabase
    .from('visitor_trials')
    .select('ip_address, email, trial_started_at, trial_ends_at, converted_to_paid')
    .order('trial_started_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Subscribers</h1>

      {/* Newsletter subscribers */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Newsletter Subscribers ({newsletterSubscribers?.length ?? 0})
        </h2>
        <NewsletterSubscribersTable initialSubscribers={newsletterSubscribers ?? []} />
      </section>

      {/* Paid subscribers */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Paid Subscribers ({subscribers?.length ?? 0})
        </h2>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Renews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {subscribers?.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-5 py-3.5 text-neutral-900 dark:text-neutral-100">{s.full_name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-neutral-500">{s.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 capitalize">
                      {s.subscription_plan ?? s.subscription_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-400 text-xs">
                    {s.subscription_period_end ? new Date(s.subscription_period_end).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {(!subscribers || subscribers.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-400 text-sm">No paid subscribers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trial visitors */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Trial Visitors (recent 50)
        </h2>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Started</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Expires</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {trials?.map((t) => {
                const expired = new Date(t.trial_ends_at) < new Date()
                return (
                  <tr key={t.ip_address} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="px-5 py-3.5 text-neutral-500">{t.email ?? 'Anonymous'}</td>
                    <td className="px-5 py-3.5 text-neutral-400 text-xs">{new Date(t.trial_started_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-neutral-400 text-xs">{new Date(t.trial_ends_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.converted_to_paid ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                        expired ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      }`}>
                        {t.converted_to_paid ? 'Converted' : expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
