'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface PopupSettings {
  heading: string
  subheading: string
  button_text: string
  background_color: string
  text_color: string
  accent_color: string
}

interface NewsletterPopupProps {
  settings: PopupSettings
  onClose: () => void
  onSubscribe: () => void
}

export default function NewsletterPopup({ settings, onClose, onSubscribe }: NewsletterPopupProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !firstName.trim()) {
      setErrorMessage('Please fill in all fields')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      onSubscribe()
      
      // Close popup after success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300"
        style={{ backgroundColor: settings.background_color }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: settings.text_color }}
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center pt-2">
          {status === 'success' ? (
            <div className="py-8">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: settings.accent_color }}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4
                className="text-xl font-bold mb-2"
                style={{ color: settings.text_color }}
              >
                You're subscribed!
              </h4>
              <p
                className="text-sm opacity-70"
                style={{ color: settings.text_color }}
              >
                Thank you for subscribing. Check your inbox for confirmation.
              </p>
            </div>
          ) : (
            <>
              <h4
                className="text-xl sm:text-2xl font-bold mb-2"
                style={{ color: settings.text_color }}
              >
                {settings.heading}
              </h4>
              <p
                className="text-sm sm:text-base mb-6 opacity-80"
                style={{ color: settings.text_color }}
              >
                {settings.subheading}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                  disabled={status === 'loading'}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                  disabled={status === 'loading'}
                />
                
                {status === 'error' && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
                
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 rounded-lg text-white font-medium text-base transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: settings.accent_color }}
                >
                  {status === 'loading' ? 'Subscribing...' : settings.button_text}
                </button>
              </form>

              <p 
                className="text-xs mt-4 opacity-50" 
                style={{ color: settings.text_color }}
              >
                No spam, ever. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
