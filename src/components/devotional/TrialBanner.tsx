'use client'

import { useState } from 'react'

export default function TrialBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (dismissed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      // Get IP via a quick fetch
      const res = await fetch('/api/trial/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ip: 'client' }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-primary-600 text-white px-4 py-3 relative">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
        {submitted ? (
          <p className="text-sm font-medium text-center sm:text-left">
            You're in! Enjoy your 14-day free trial of all devotionals.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-center sm:text-left">
              You have free access for 14 days — enter your email to stay updated.
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
