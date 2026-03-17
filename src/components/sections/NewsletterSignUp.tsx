'use client'

import { useState } from 'react'

export interface NewsletterSignUpData {
  heading: string
  subheading: string
  button_text: string
  success_message: string
  background_color: string
  background_image_url: string
  text_color: string
  button_bg_color?: string
  button_text_color?: string
  button_hover_bg_color?: string
  button_hover_text_color?: string
}

interface NewsletterSignUpProps {
  data: NewsletterSignUpData
}

export default function NewsletterSignUp({ data }: NewsletterSignUpProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setStatus('success')
        setFirstName('')
        setEmail('')
      } else {
        setStatus('error')
        setErrorMsg(json.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  const bgColor = data.background_color || '#F5F2ED'
  const bgImage = data.background_image_url
  const textColor = data.text_color || '#1a1a1a'

  return (
    <section
      className="relative w-full py-20 px-6 md:px-12 lg:px-24 overflow-hidden"
      style={{
        backgroundColor: bgColor,
        ...(bgImage && {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        {data.heading && (
          <h2
            className="text-3xl md:text-4xl font-bold font-heading mb-4 text-balance"
            style={{ color: textColor }}
          >
            {data.heading}
          </h2>
        )}
        {data.subheading && (
          <p
            className="text-base md:text-lg font-body leading-relaxed mb-8"
            style={{ color: textColor, opacity: 0.75 }}
          >
            {data.subheading}
          </p>
        )}

        {status === 'success' ? (
          <div className="py-6 px-8 rounded-2xl bg-white/60 text-neutral-800 font-body text-lg">
            {data.success_message || 'You are subscribed! Thank you for joining.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="flex-1 px-5 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-3.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-7 py-3.5 font-medium text-sm rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap font-body"
              style={{ 
                backgroundColor: data.button_bg_color || 'var(--color-newsletter-button-bg)', 
                color: data.button_text_color || 'var(--color-newsletter-button-text)' 
              }}
              onMouseEnter={(e) => {
                if (data.button_hover_bg_color) {
                  e.currentTarget.style.backgroundColor = data.button_hover_bg_color
                }
                if (data.button_hover_text_color) {
                  e.currentTarget.style.color = data.button_hover_text_color
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = data.button_bg_color || 'var(--color-newsletter-button-bg)'
                e.currentTarget.style.color = data.button_text_color || 'var(--color-newsletter-button-text)'
              }}
            >
              {status === 'loading' ? 'Subscribing...' : (data.button_text || 'Subscribe')}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-3 text-sm text-red-500 font-body">{errorMsg}</p>
        )}
      </div>
    </section>
  )
}
