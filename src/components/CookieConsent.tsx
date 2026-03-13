'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

const CONSENT_KEY = 'cookie-consent'

export type ConsentStatus = 'pending' | 'accepted' | 'declined'

export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending'
  const stored = localStorage.getItem(CONSENT_KEY)
  if (stored === 'accepted') return 'accepted'
  if (stored === 'declined') return 'declined'
  return 'pending'
}

export function setConsentStatus(status: 'accepted' | 'declined') {
  localStorage.setItem(CONSENT_KEY, status)
  // Dispatch custom event so PostHogProvider can react
  window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: status }))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if consent hasn't been given yet
    const status = getConsentStatus()
    if (status === 'pending') {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setConsentStatus('accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    setConsentStatus('declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="relative rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 p-5 sm:p-6">
          {/* Close button */}
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-8">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              We value your privacy
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from. 
              By clicking "Accept", you consent to our use of cookies.{' '}
              <Link 
                href="/privacy" 
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Learn more
              </Link>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-colors"
              >
                Accept cookies
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-medium text-sm transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
