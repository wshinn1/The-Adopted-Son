import { ApplicationLayout } from '@/app/(app)/application-layout'
import PricingPlans from '@/components/devotional/PricingPlans'
import { PLANS } from '@/lib/plans'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscribe — The Adopted Son',
  description: 'Choose a plan to get unlimited access to all devotionals.',
}

export default function PricingPage() {
  return (
    <ApplicationLayout headerStyle="header-2">
      <main className="container py-16 lg:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 text-balance">
            Simple, Honest Pricing
          </h1>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-pretty">
            Full access to every devotional, past and present. Cancel anytime.
          </p>
        </div>
        <PricingPlans plans={PLANS} />
      </main>
    </ApplicationLayout>
  )
}
