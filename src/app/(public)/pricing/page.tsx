import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { getPageWithSections } from '@/lib/site-settings'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

const DEFAULT_OG = 'https://www.theadoptedson.com/og-image.jpg'

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageWithSections('pricing')
  const page = data?.page as any

  const title = page?.og_title || 'Pricing'
  const description = page?.og_description || 'Subscribe to The Adopted Son for full access to all devotionals. Start with a 14-day free trial.'
  const ogImage = page?.og_image_url || DEFAULT_OG

  return {
    title,
    description,
    openGraph: {
      title: `${title} — The Adopted Son`,
      description,
      type: 'website',
      url: 'https://www.theadoptedson.com/pricing',
      siteName: 'The Adopted Son',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — The Adopted Son`,
      description,
      images: [ogImage],
    },
    alternates: { canonical: 'https://www.theadoptedson.com/pricing' },
  }
}

export default async function PricingPage() {
  // Check if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-4xl px-6 py-16 md:px-12">
        <div className="text-center">
          <h1 className="text-4xl font-medium text-foreground md:text-5xl font-heading">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Get full access to all devotionals and spiritual content. 
            Start with a 14-day free trial, no credit card required.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl border bg-card p-8 ${
                plan.badge 
                  ? 'border-primary ring-2 ring-primary' 
                  : 'border-border'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              
              <h2 className="text-2xl font-semibold text-foreground font-heading">
                {plan.name}
              </h2>
              <p className="mt-2 text-muted-foreground font-body">
                {plan.description}
              </p>
              
              <div className="mt-6">
                <span className="text-4xl font-bold text-foreground">
                  ${(plan.priceInCents / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  /{plan.interval === 'month' ? 'month' : 'year'}
                </span>
              </div>

              {plan.interval === 'year' && (
                <p className="mt-1 text-sm text-green-600 font-medium">
                  Only ${(plan.priceInCents / 100 / 12).toFixed(2)}/month
                </p>
              )}
              
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-muted-foreground">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={isLoggedIn ? `/subscribe?plan=${plan.id}` : `/auth/sign-up?plan=${plan.id}`}
                className={`mt-8 block w-full rounded-xl py-3 text-center font-medium transition-colors ${
                  plan.badge
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-foreground text-background hover:bg-foreground/90'
                }`}
              >
                Subscribe to {plan.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          {isLoggedIn ? (
            <p className="text-muted-foreground">
              Signed in as <span className="font-medium">{user?.email}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-muted/50 p-6 text-center">
          <h3 className="font-semibold text-foreground">30-Day Money Back Guarantee</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Not satisfied? Contact us within 30 days for a full refund, no questions asked.
          </p>
        </div>
      </div>
    </div>
  )
}
