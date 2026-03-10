export interface Plan {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: 'month' | 'year'
  stripePriceId: string
  features: string[]
  badge?: string
}

// Update stripePriceId values with your real Stripe price IDs after creating
// products in the Stripe dashboard or via the admin settings page.
export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Full access to all devotionals, billed monthly.',
    priceInCents: 999,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_MONTHLY ?? 'price_monthly_placeholder',
    features: [
      'Unlimited devotionals',
      'Daily email delivery',
      'Scripture references',
      'Downloadable content',
    ],
  },
  {
    id: 'annual',
    name: 'Annual',
    description: 'Best value — save 33% with an annual plan.',
    priceInCents: 7999,
    interval: 'year',
    stripePriceId: process.env.STRIPE_PRICE_ANNUAL ?? 'price_annual_placeholder',
    badge: 'Best Value',
    features: [
      'Everything in Monthly',
      'Save 33% vs monthly',
      'Priority support',
      'Bonus content',
    ],
  },
]
