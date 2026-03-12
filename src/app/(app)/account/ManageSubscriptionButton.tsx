'use client'

import { useState } from 'react'
import { createCustomerPortalSession } from '@/app/actions/stripe'

export default function ManageSubscriptionButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const url = await createCustomerPortalSession(userId)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Unable to open subscription management. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className="px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  )
}
