import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscribeCheckout from './SubscribeCheckout'

export const metadata = {
  title: 'Subscribe — The Adopted Son',
  description: 'Complete your subscription',
}

interface Props {
  searchParams: Promise<{ plan?: string }>
}

export default async function SubscribePage({ searchParams }: Props) {
  const params = await searchParams
  const planId = params.plan || 'annual'
  
  // Require authentication - redirect to sign up if not logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/auth/sign-up?plan=${planId}`)
  }
  
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) {
    redirect('/pricing')
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-foreground font-heading">
            Complete Your Subscription
          </h1>
          <p className="mt-2 text-muted-foreground">
            Subscribing as <strong>{user.email}</strong> to the <strong>{plan.name}</strong> plan at{' '}
            <strong>${(plan.priceInCents / 100).toFixed(2)}/{plan.interval}</strong>
          </p>
        </div>

        <SubscribeCheckout planId={planId} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          You can cancel your subscription at any time from your account settings.
        </p>
      </div>
    </div>
  )
}
