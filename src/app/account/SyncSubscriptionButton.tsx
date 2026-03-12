'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function SyncSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function handleSync() {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        router.refresh()
      } else {
        setMessage(data.error || data.message || 'Failed to sync subscription')
      }
    } catch (error) {
      setMessage('Failed to sync subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : 'Sync subscription status'}
      </button>
      {message && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}
    </div>
  )
}
