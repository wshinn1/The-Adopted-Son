import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ManageSubscriptionButton from '../ManageSubscriptionButton'
import SyncSubscriptionButton from '../SyncSubscriptionButton'

export default async function AccountBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, subscription_period_end, stripe_customer_id')
    .eq('id', user!.id)
    .single()

  const isActive =
    profile?.subscription_status === 'active' &&
    profile?.subscription_period_end &&
    new Date(profile.subscription_period_end) > new Date()

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Billing</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 max-w-lg">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Subscription
        </h2>

        {isActive ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Plan</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {profile?.subscription_plan ?? 'Active'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Status</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                Active
              </span>
            </div>
            {profile?.subscription_period_end && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Renews</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {new Date(profile.subscription_period_end).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {profile?.stripe_customer_id && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <ManageSubscriptionButton userId={user!.id} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              You do not have an active subscription.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Subscribe now
            </Link>
            <SyncSubscriptionButton />
          </div>
        )}
      </div>
    </div>
  )
}
