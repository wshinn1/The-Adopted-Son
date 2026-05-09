import { supabaseAdmin } from '@/lib/supabase/admin'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Givings — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminGivingsPage() {
  const { data: givings } = await supabaseAdmin
    .from('givings')
    .select('id, donor_name, donor_email, donor_phone, amount_cents, is_recurring, status, note, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const succeeded = givings?.filter(g => g.status === 'succeeded') ?? []
  const totalCents = succeeded.reduce((sum, g) => sum + g.amount_cents, 0)
  const monthlyGivers = succeeded.filter(g => g.is_recurring)
  const monthlyRecurringTotal = monthlyGivers.reduce((sum, g) => sum + g.amount_cents, 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Givings</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total given', value: `$${(totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
          { label: 'Monthly recurring', value: `$${(monthlyRecurringTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo` },
          { label: 'Total gifts', value: String(succeeded.length) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Givings table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            All Givings ({givings?.length ?? 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Donor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {givings?.map((g) => (
                <tr key={g.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-5 py-3.5 text-neutral-400 text-xs whitespace-nowrap">
                    {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{g.donor_name}</p>
                    <p className="text-xs text-neutral-400">{g.donor_email}</p>
                    {g.donor_phone && <p className="text-xs text-neutral-400">{g.donor_phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    ${(g.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                    {g.is_recurring ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                        Monthly
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        One-time
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.status === 'succeeded'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : g.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-400 text-xs max-w-[200px] truncate">
                    {g.note ?? '—'}
                  </td>
                </tr>
              ))}
              {(!givings || givings.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-400">
                    No givings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
