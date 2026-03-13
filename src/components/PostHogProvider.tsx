'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key) return

    posthog.init(key, {
      api_host: host ?? 'https://us.i.posthog.com',
      capture_pageview: true, // Let PostHog handle page views automatically
      capture_pageleave: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
