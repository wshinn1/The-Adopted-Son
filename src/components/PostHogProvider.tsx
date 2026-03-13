'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import { getConsentStatus, type ConsentStatus } from './CookieConsent'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initPostHog = () => {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (!key) return

      posthog.init(key, {
        api_host: host ?? 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      })
      setInitialized(true)
    }

    // Check initial consent status
    const status = getConsentStatus()
    if (status === 'accepted') {
      initPostHog()
    }

    // Listen for consent changes
    const handleConsentChange = (e: CustomEvent<ConsentStatus>) => {
      if (e.detail === 'accepted' && !initialized) {
        initPostHog()
      } else if (e.detail === 'declined' && initialized) {
        // Opt out if they decline after accepting
        posthog.opt_out_capturing()
      }
    }

    window.addEventListener('cookie-consent-change', handleConsentChange as EventListener)
    return () => {
      window.removeEventListener('cookie-consent-change', handleConsentChange as EventListener)
    }
  }, [initialized])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
