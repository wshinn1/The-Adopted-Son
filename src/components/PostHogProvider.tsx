'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { getConsentStatus, type ConsentStatus } from './CookieConsent'

// Check if PostHog is already initialized using its internal state
const isPostHogInitialized = () => {
  try {
    // PostHog sets __loaded when initialized
    return !!(posthog as unknown as { __loaded?: boolean }).__loaded
  } catch {
    return false
  }
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const hasSetupListener = useRef(false)

  useEffect(() => {
    if (hasSetupListener.current) return
    hasSetupListener.current = true

    const initPostHog = () => {
      // Check PostHog's internal state to prevent re-init
      if (isPostHogInitialized()) return
      
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (!key) return

      posthog.init(key, {
        api_host: host ?? 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      })
    }

    // Check initial consent status
    const status = getConsentStatus()
    if (status === 'accepted') {
      initPostHog()
    }

    // Listen for consent changes
    const handleConsentChange = (e: CustomEvent<ConsentStatus>) => {
      if (e.detail === 'accepted') {
        initPostHog()
      } else if (e.detail === 'declined' && isPostHogInitialized()) {
        posthog.opt_out_capturing()
      }
    }

    window.addEventListener('cookie-consent-change', handleConsentChange as EventListener)
    return () => {
      window.removeEventListener('cookie-consent-change', handleConsentChange as EventListener)
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
