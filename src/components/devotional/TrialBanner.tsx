'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface TrialInfo {
  isAdmin: boolean
  isSubscribed: boolean
  trialDaysLeft: number | null
  trialExpired: boolean
}

interface BannerSettings {
  active_message: string
  expired_message: string
  success_message: string
  button_text: string
  expired_button_text: string
  placeholder_text: string
  active_bg_color: string
  active_text_color: string
  active_button_bg: string
  active_button_text: string
  expired_bg_color: string
  expired_text_color: string
  expired_button_bg: string
  expired_button_text: string
}

const defaultSettings: BannerSettings = {
  active_message: 'You have free access for {days} — enter your email to stay updated.',
  expired_message: 'Your free trial has ended. Subscribe to continue reading premium content.',
  success_message: "You're in! Enjoy your free trial of all devotionals.",
  button_text: 'Notify me',
  expired_button_text: 'View Plans',
  placeholder_text: 'your@email.com',
  active_bg_color: '#2B4A6F',
  active_text_color: '#ffffff',
  active_button_bg: '#ffffff',
  active_button_text: '#2B4A6F',
  expired_bg_color: '#B8704D',
  expired_text_color: '#ffffff',
  expired_button_bg: '#ffffff',
  expired_button_text: '#B8704D',
}

export default function TrialBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<BannerSettings>(defaultSettings)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkTrialStatus() {
      try {
        // Load banner settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'trial_banner_settings')
          .single()
        
        if (settingsData?.value) {
          const parsed = typeof settingsData.value === 'string' 
            ? JSON.parse(settingsData.value) 
            : settingsData.value
          setSettings({ ...defaultSettings, ...parsed })
        }

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()

        // IMPORTANT: Hide banner for ALL logged-in users, no exceptions
        if (user) {
          setTrialInfo({ isAdmin: true, isSubscribed: false, trialDaysLeft: null, trialExpired: false })
          setLoading(false)
          return
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
      <div 
        className="px-4 py-3 relative"
        style={{ backgroundColor: settings.expired_bg_color, color: settings.expired_text_color }}
      >
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-center sm:text-left">
            {settings.expired_message}
          </p>
          <a
            href="/pricing"
            className="text-sm px-4 py-1.5 font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: settings.expired_button_bg, color: settings.expired_button_text }}
          >
            {settings.expired_button_text}
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100 text-lg leading-none"
            style={{ color: `${settings.expired_text_color}cc` }}
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="px-4 py-3 relative"
      style={{ backgroundColor: settings.active_bg_color, color: settings.active_text_color }}
    >
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
        {submitted ? (
          <p className="text-sm font-medium text-center sm:text-left">
            {settings.success_message}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-center sm:text-left">
              {settings.active_message.replace('{days}', daysText)}
            </p>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 shrink-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={settings.placeholder_text}
                className="text-sm px-3 py-1.5 rounded-lg text-neutral-900 focus:outline-none w-52"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="text-sm px-3 py-1.5 font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: settings.active_button_bg, color: settings.active_button_text }}
              >
                {submitting ? 'Saving...' : settings.button_text}
              </button>
            </form>
          </>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100 text-lg leading-none"
          style={{ color: `${settings.active_text_color}cc` }}
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}
