import { createClient } from '@/lib/supabase/server'

export default async function AccountBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: givings } = await supabase
    .from('givings')
    .select('id, amount_cents, is_recurring, status, created_at, note')
    .eq('donor_email', user?.email ?? '')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Giving History</h1>

      {givings && givings.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {givings.map((g) => (
                <tr key={g.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-5 py-3.5 text-neutral-500 text-xs">
                    {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                    ${(g.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-500">
                    {g.is_recurring ? 'Monthly' : 'One-time'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.status === 'succeeded'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {g.status === 'succeeded' ? 'Completed' : g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">No giving history yet.</p>
          <a
            href="/give"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Give now
          </a>
        </div>
      )}
    </div>
  )
}
