'use client'

import { useState } from 'react'

export interface ContactForm1Data {
  heading: string
  subheading: string
  button_text: string
  success_message: string
  background_color: string
  text_color: string
}

interface ContactForm1Props {
  data: ContactForm1Data
}

export default function ContactForm1({ data }: ContactForm1Props) {
  const heading = data.heading || 'Contact'
  const subheading = data.subheading || 'Have a question or just want to say hello? Fill out the form below and we\'ll get back to you.'
  const buttonText = data.button_text || 'Submit'
  const successMessage = data.success_message || 'Thank you for reaching out! We\'ll be in touch soon.'
  const bgColor = data.background_color || '#ffffff'
  const textColor = data.text_color || '#1a1a1a'

  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setStatus('submitting')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section
      className="w-full py-16 px-6 md:px-12 lg:px-24"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold font-heading mb-4 text-balance"
            style={{ color: textColor }}
          >
            {heading}
          </h2>
          {subheading && (
            <p
              className="text-base leading-relaxed max-w-xl mx-auto font-body"
              style={{ color: textColor, opacity: 0.75 }}
            >
              {subheading}
            </p>
          )}
        </div>

        {status === 'success' ? (
          <div className="text-center py-12">
            <p className="text-lg font-body" style={{ color: textColor }}>
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Name + Email row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium mb-2 font-body"
                  style={{ color: textColor }}
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 transition-colors"
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium mb-2 font-body"
                  style={{ color: textColor }}
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Message */}
            <div className="mb-8">
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium mb-2 font-body"
                style={{ color: textColor }}
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={8}
                className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
            )}

            {/* Submit */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="bg-neutral-900 text-white px-10 py-3 text-sm font-medium font-body hover:bg-neutral-700 transition-colors disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending...' : buttonText}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
