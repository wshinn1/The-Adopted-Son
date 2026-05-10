'use client'

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [25, 50, 100, 250]

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

interface CheckoutProps {
  clientSecret: string
  type: 'payment' | 'setup'
  customerId?: string
  donorName: string
  donorEmail: string
  amountCents: number
  isRecurring: boolean
  note: string
  onSuccess: () => void
  onBack: () => void
}

function StripeCheckoutForm({
  clientSecret,
  type,
  customerId,
  donorName,
  donorEmail,
  amountCents,
  isRecurring,
  note,
  onSuccess,
  onBack,
}: CheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    if (type === 'payment') {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/give/thank-you` },
        redirect: 'if_required',
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed')
        setLoading(false)
        return
      }
      onSuccess()
    } else {
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: `${window.location.origin}/give/thank-you` },
        redirect: 'if_required',
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Setup failed')
        setLoading(false)
        return
      }

      const res = await fetch('/api/givings/confirm-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupIntentId: setupIntent?.id, customerId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to confirm recurring giving')
        setLoading(false)
        return
      }
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600 space-y-1">
        <div className="flex justify-between">
          <span>Giving amount</span>
          <span className="font-semibold text-neutral-900">${(amountCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frequency</span>
          <span className="font-semibold text-neutral-900">{isRecurring ? 'Monthly' : 'One-time'}</span>
        </div>
        {note && (
          <div className="flex justify-between">
            <span>Note</span>
            <span className="font-semibold text-neutral-900 truncate ml-4 max-w-[200px]">{note}</span>
          </div>
        )}
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? 'Processing…' : `Give ${formatCents(amountCents)}${isRecurring ? '/mo' : ''}`}
        </button>
      </div>
    </form>
  )
}

export default function GivingForm() {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [presetAmount, setPresetAmount] = useState<number | null>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [note, setNote] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<'payment' | 'setup'>('payment')
  const [customerId, setCustomerId] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const amountCents = presetAmount !== null
    ? presetAmount * 100
    : Math.round(parseFloat(customAmount || '0') * 100)

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email.')
      return
    }
    if (amountCents < 100) {
      setError('Minimum giving amount is $1.00.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/givings/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          amountCents,
          isRecurring,
          note: note.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to initialize payment')
      setClientSecret(data.clientSecret)
      setPaymentType(data.type)
      setCustomerId(data.customerId)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    const signUpUrl = `/auth/sign-up?email=${encodeURIComponent(email)}`

    return (
      <div className="py-6 space-y-6">
        {/* Thank you header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🙏</div>
          <h2 className="text-2xl font-semibold text-neutral-900">Thank you!</h2>
          <p className="text-neutral-500 text-sm">
            Your {isRecurring ? 'monthly ' : ''}gift of ${(amountCents / 100).toFixed(2)} has been received.
            A confirmation has been sent to {email}.
          </p>
        </div>

        {/* Monthly donors: account creation prompt */}
        {isRecurring && (
          <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="font-semibold text-neutral-900 text-sm">Create a free account to manage your giving</p>
                <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                  Since you're giving monthly, an account lets you view your giving history and cancel at any time. We'll pre-fill your email.
                </p>
              </div>
            </div>
            <a
              href={signUpUrl}
              className="block w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Create your free account →
            </a>
            <p className="text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <a href="/auth/login" className="text-blue-600 hover:underline">Sign in</a>
            </p>
          </div>
        )}

        {/* Read devotionals link */}
        <a
          href="/devotionals"
          className={`block text-center px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isRecurring
              ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Read devotionals
        </a>
      </div>
    )
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#2563eb', borderRadius: '12px' },
          },
        }}
      >
        <StripeCheckoutForm
          clientSecret={clientSecret}
          type={paymentType}
          customerId={customerId}
          donorName={name}
          donorEmail={email}
          amountCents={amountCents}
          isRecurring={isRecurring}
          note={note}
          onSuccess={() => setStep('success')}
          onBack={() => setStep('details')}
        />
      </Elements>
    )
  }

  return (
    <form onSubmit={handleProceed} className="space-y-6">
      {/* Amount selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">Giving amount</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => { setPresetAmount(amt); setCustomAmount('') }}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                presetAmount === amt
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-neutral-300 text-neutral-700 hover:border-blue-400'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
          <input
            type="number"
            min="1"
            step="any"
            placeholder="Other amount"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setPresetAmount(null) }}
            className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">Frequency</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'One-time', value: false },
            { label: 'Monthly', value: true },
          ].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsRecurring(value)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                isRecurring === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-neutral-300 text-neutral-700 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Full name</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
            Phone <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(555) 000-0000"
          />
        </div>
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-neutral-700 mb-1">
            Note <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="A short message…"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || amountCents < 100}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
      >
        {loading ? 'Please wait…' : `Continue — Give ${amountCents >= 100 ? formatCents(amountCents) : ''}${isRecurring ? '/mo' : ''}`}
      </button>
    </form>
  )
}
