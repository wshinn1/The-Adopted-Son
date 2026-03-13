'use client'

import { useState } from 'react'
import { XCircle } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  subscription_plan: string | null
  subscription_period_end: string | null
}

interface Props {
  initialSubscribers: Subscriber[]
}

export default function PaidSubscribersTable({ initialSubscribers }: Props) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const confirmSub = subscribers.find((s) => s.id === confirmId)

  const handleCancel = async () => {
    if (!confirmId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmId, cancelImmediately }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to cancel')

      if (cancelImmediately) {
        setSubscribers((prev) => prev.filter((s) => s.id !== confirmId))
        setSuccessMsg('Subscription cancelled immediately. They no longer have access.')
      } else {
        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === confirmId
              ? { ...s, subscription_status: 'canceling' }
              : s
          )
        )
        setSuccessMsg(`Subscription set to cancel at end of billing period.`)
      }

      setConfirmId(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-4 text-green-600 hover:text-green-800">
            <XCircle className="size-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Renews</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {subscribers.map((s) => (
              <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="px-5 py-3.5 text-neutral-900 dark:text-neutral-100">{s.full_name ?? '—'}</td>
                <td className="px-5 py-3.5 text-neutral-500">{s.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    s.subscription_status === 'canceling'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  }`}>
                    {s.subscription_status === 'canceling'
                      ? 'Canceling'
                      : (s.subscription_plan ?? s.subscription_status)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-neutral-400 text-xs">
                  {s.subscription_period_end
                    ? new Date(s.subscription_period_end).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {s.subscription_status !== 'canceling' && (
                    <button
                      onClick={() => { setConfirmId(s.id); setCancelImmediately(false); setError(null) }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Cancel Sub
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-neutral-400 text-sm">
                  No paid subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      {confirmId && confirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              Cancel subscription?
            </h3>
            <p className="text-sm text-neutral-500 mb-5">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{confirmSub.full_name ?? confirmSub.email}</span>
              {' '}— choose when to cancel:
            </p>

            {/* Cancel timing toggle */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <input
                  type="radio"
                  name="cancel-timing"
                  checked={!cancelImmediately}
                  onChange={() => setCancelImmediately(false)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">At end of billing period</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    They keep access until{' '}
                    {confirmSub.subscription_period_end
                      ? new Date(confirmSub.subscription_period_end).toLocaleDateString()
                      : 'renewal date'}
                    . No future charges.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <input
                  type="radio"
                  name="cancel-timing"
                  checked={cancelImmediately}
                  onChange={() => setCancelImmediately(true)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Immediately</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Access is revoked right now. This cannot be undone.</p>
                </div>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => { setConfirmId(null); setError(null) }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
