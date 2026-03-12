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

// Stripe price IDs are set via environment variables
export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Full access to all devotionals, billed monthly.',
    priceInCents: 299, // $2.99
    interval: 'month',
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? '',
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
    description: 'Best value — save 58% with an annual plan.',
    priceInCents: 1499, // $14.99
    interval: 'year',
    stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID ?? '',
    badge: 'Best Value',
    features: [
      'Everything in Monthly',
      'Save 58% vs monthly',
      'Priority support',
      'Bonus content',
    ],
  },
]
