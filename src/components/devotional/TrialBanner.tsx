'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface TrialInfo {
  isAdmin: boolean
  isSubscribed: boolean
  trialDaysLeft: number | null
  trialExpired: boolean
}

export default function TrialBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkTrialStatus() {
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if admin or subscribed
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, subscription_status, subscription_period_end')
            .eq('id', user.id)
            .single()

          if (profile?.is_admin) {
            setTrialInfo({ isAdmin: true, isSubscribed: false, trialDaysLeft: null, trialExpired: false })
            setLoading(false)
            return
          }

          if (
            profile?.subscription_status === 'active' &&
            profile?.subscription_period_end &&
            new Date(profile.subscription_period_end) > new Date()
          ) {
            setTrialInfo({ isAdmin: false, isSubscribed: true, trialDaysLeft: null, trialExpired: false })
            setLoading(false)
            return
          }
        }

        // Not logged in or not subscribed - check IP trial
        const response = await fetch('/api/trial/status')
        if (response.ok) {
          const data = await response.json()
          setTrialInfo({
            isAdmin: false,
            isSubscribed: false,
            trialDaysLeft: data.daysLeft ?? null,
            trialExpired: data.expired ?? false,
          })
        }
      } catch (error) {
        console.error('Error checking trial status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkTrialStatus()
  }, [supabase])

  // Don't show banner while loading
  if (loading) return null

  // Don't show banner for admins or subscribers
  if (trialInfo?.isAdmin || trialInfo?.isSubscribed) return null

  // Don't show if dismissed
  if (dismissed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/trial/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const daysText = trialInfo?.trialDaysLeft !== null 
    ? `${trialInfo?.trialDaysLeft} day${trialInfo?.trialDaysLeft === 1 ? '' : 's'}`
    : '14 days'

  // Show expired message
  if (trialInfo?.trialExpired) {
    return (
      <div className="bg-amber-600 text-white px-4 py-3 relative">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-center sm:text-left">
            Your free trial has ended. Subscribe to continue reading premium content.
          </p>
          <a
            href="/pricing"
            className="text-sm px-4 py-1.5 bg-white text-amber-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          >
            View Plans
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-primary-600 text-white px-4 py-3 relative">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
        {submitted ? (
          <p className="text-sm font-medium text-center sm:text-left">
            You're in! Enjoy your free trial of all devotionals.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-center sm:text-left">
              You have free access for {daysText} — enter your email to stay updated.
            </p>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 shrink-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="text-sm px-3 py-1.5 rounded-lg text-neutral-900 focus:outline-none w-52"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="text-sm px-3 py-1.5 bg-white text-primary-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Notify me'}
              </button>
            </form>
          </>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none"
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}
