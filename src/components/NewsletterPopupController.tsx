'use client'

import { useState, useEffect } from 'react'
import NewsletterPopup from './NewsletterPopup'

interface PopupSettings {
  enabled: boolean
  delay_seconds: number
  reshow_days: number
  heading: string
  subheading: string
  button_text: string
  background_color: string
  text_color: string
  accent_color: string
}

export default function NewsletterPopupController() {
  const [showPopup, setShowPopup] = useState(false)
  const [settings, setSettings] = useState<PopupSettings | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    checkAndShowPopup()
  }, [])

  async function checkAndShowPopup() {
    try {
      // First, fetch popup settings
      const settingsRes = await fetch('/api/popup/settings')
      if (!settingsRes.ok) {
        setChecked(true)
        return
      }
      
      const settingsData = await settingsRes.json()
      
      // If popup is disabled, don't show
      if (!settingsData.enabled) {
        setChecked(true)
        return
      }

      setSettings(settingsData)

      // Check if we should show the popup (IP-based)
      const checkRes = await fetch('/api/popup/check')
      if (!checkRes.ok) {
        setChecked(true)
        return
      }
      
      const checkData = await checkRes.json()
      
      if (checkData.shouldShow) {
        // Wait for the configured delay before showing
        const delayMs = (settingsData.delay_seconds || 7) * 1000
        setTimeout(() => {
          setShowPopup(true)
        }, delayMs)
      }
      
      setChecked(true)
    } catch (err) {
      console.error('Error checking popup status:', err)
      setChecked(true)
    }
  }

  async function handleClose() {
    setShowPopup(false)
    
    // Record dismissal
    try {
      await fetch('/api/popup/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: false }),
      })
    } catch (err) {
      console.error('Error recording popup dismissal:', err)
    }
  }

  async function handleSubscribe() {
    // Record as subscribed dismissal
    try {
      await fetch('/api/popup/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: true }),
      })
    } catch (err) {
      console.error('Error recording popup subscription:', err)
    }
  }

  // Don't render anything until we've checked
  if (!checked || !settings || !showPopup) {
    return null
  }

  return (
    <NewsletterPopup
      settings={settings}
      onClose={handleClose}
      onSubscribe={handleSubscribe}
    />
  )
}
