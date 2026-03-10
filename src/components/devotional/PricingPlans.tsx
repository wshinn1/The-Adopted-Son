'use client'

import { startCheckoutSession } from '@/app/actions/stripe'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useState, useCallback } from 'react'
import type { Plan } from '@/lib/plans'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  plans: Plan[]
}

export default function PricingPlans({ plans }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!selectedPlanId) throw new Error('No plan selected')
    const clientSecret = await startCheckoutSession(selectedPlanId)
    if (!clientSecret) throw new Error('Failed to create checkout session')
    return clientSecret
  }, [selectedPlanId])

  if (selectedPlanId) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setSelectedPlanId(null)}
          className="mb-6 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
        >
          ← Back to plans
        </button>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-2xl border p-8 flex flex-col ${
            plan.badge
              ? 'border-primary-500 shadow-lg shadow-primary-500/10'
              : 'border-neutral-200 dark:border-neutral-700'
          } bg-white dark:bg-neutral-900`}
        >
          {plan.badge && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
              {plan.badge}
            </span>
          )}
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {plan.name}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                ${(plan.priceInCents / 100).toFixed(2)}
              </span>
              <span className="text-neutral-400 text-sm">/ {plan.interval}</span>
            </div>
            {plan.interval === 'year' && (
              <p className="mt-1 text-sm text-primary-600 dark:text-primary-400 font-medium">
                ${((plan.priceInCents / 100) / 12).toFixed(2)}/month billed annually
              </p>
            )}
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {plan.description}
            </p>
          </div>
          <ul className="mt-6 space-y-2.5 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="text-primary-500 mt-0.5 shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setSelectedPlanId(plan.id)}
            className={`mt-8 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              plan.badge
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            Get started
          </button>
        </div>
      ))}
    </div>
  )
}
