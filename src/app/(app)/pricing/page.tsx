import BackgroundSection from '@/components/BackgroundSection'
import PricingPlans from '@/components/devotional/PricingPlans'
import { PLANS } from '@/lib/plans'
import HeadingWithSub from '@/shared/Heading'
import { Metadata } from 'next'
import { CheckIcon } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
  title: 'Subscribe — The Adopted Son',
  description: 'Choose a plan to get unlimited access to all devotionals.',
}

const FEATURES = [
  'Unlimited access to all devotionals',
  'New devotionals every day',
  'Scripture references and reflections',
  'Mobile-friendly reading',
  'Cancel anytime',
]

export default function PricingPage() {
  return (
    <div className="relative">
      {/* HEADER */}
      <div className="container pt-16 lg:pt-24 pb-12 text-center">
        <HeadingWithSub 
          subHeading="Full access to every devotional, past and present. Cancel anytime."
          isCenter
        >
          Simple, Honest Pricing
        </HeadingWithSub>
      </div>

      {/* PRICING CARDS */}
      <div className="relative py-16">
        <BackgroundSection />
        <div className="container">
          <PricingPlans plans={PLANS} />
        </div>
      </div>

      {/* FEATURES */}
      <div className="container py-16 lg:py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-10">
            What's Included
          </h2>
          <ul className="space-y-4">
            {FEATURES.map((feature, index) => (
              <li key={index} className="flex items-center gap-4 text-lg text-neutral-700 dark:text-neutral-300">
                <span className="shrink-0 size-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="relative py-16">
        <BackgroundSection />
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem 
              question="Can I cancel anytime?"
              answer="Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
            />
            <FaqItem 
              question="Is there a free trial?"
              answer="We offer a 14-day free trial for new visitors. During this time, you can access all content without signing up."
            />
            <FaqItem 
              question="What payment methods do you accept?"
              answer="We accept all major credit cards through our secure payment processor, Stripe."
            />
            <FaqItem 
              question="Can I switch between monthly and annual?"
              answer="Absolutely. You can change your plan at any time from your account billing settings."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {question}
      </h3>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {answer}
      </p>
    </div>
  )
}
