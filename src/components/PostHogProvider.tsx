'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { getConsentStatus, type ConsentStatus } from './CookieConsent'

// Module-level flag to prevent re-initialization across re-renders
let posthogInitialized = false

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const hasSetupListener = useRef(false)

  useEffect(() => {
    if (hasSetupListener.current) return
    hasSetupListener.current = true

    const initPostHog = () => {
      if (posthogInitialized) return
      
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (!key) return

      posthog.init(key, {
        api_host: host ?? 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      })
      posthogInitialized = true
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
      } else if (e.detail === 'declined' && posthogInitialized) {
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
