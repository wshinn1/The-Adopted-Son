'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  first_name: string | null
  subscribed_at: string
  is_active: boolean
}

export default function NewsletterSubscribersTable({
  initialSubscribers,
}: {
  initialSubscribers: Subscriber[]
}) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Remove ${email} from the newsletter list?`)) return
    setDeleting(id)
    try {
      const res = await fetch('/api/newsletter/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id))
      } else {
        alert('Failed to delete subscriber. Please try again.')
      }
    } catch {
      alert('Something went wrong.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <tr>
            <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">First Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Subscribed</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {subscribers.map((s) => (
            <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
              <td className="px-5 py-3.5 text-neutral-900 dark:text-neutral-100">{s.first_name ?? '—'}</td>
              <td className="px-5 py-3.5 text-neutral-500">{s.email}</td>
              <td className="px-5 py-3.5 text-neutral-400 text-xs">
                {new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-5 py-3.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {s.is_active ? 'Active' : 'Unsubscribed'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => handleDelete(s.id, s.email)}
                  disabled={deleting === s.id}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                  aria-label={`Delete ${s.email}`}
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-neutral-400 text-sm">
                No newsletter subscribers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
