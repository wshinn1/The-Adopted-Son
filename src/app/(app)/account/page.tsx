import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import Link from 'next/link'

export const metadata = {
  title: 'Account — The Adopted Son',
  description: 'Manage your account and subscription',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/account')
  }

  // Get user profile with subscription info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const plan = profile?.subscription_plan 
    ? PLANS.find(p => p.id === profile.subscription_plan)
    : null

  const isActive = profile?.subscription_status === 'active'
  const periodEnd = profile?.subscription_period_end 
    ? new Date(profile.subscription_period_end)
    : null

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-medium text-foreground font-heading">
          Account Settings
        </h1>

        {/* Profile Section */}
        <section className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-foreground">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <p className="text-foreground">{profile?.full_name || 'Not set'}</p>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
          
          {isActive && plan ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{plan.name} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    ${(plan.priceInCents / 100).toFixed(2)}/{plan.interval}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
              
              {periodEnd && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Your subscription renews on{' '}
                  <span className="font-medium text-foreground">
                    {periodEnd.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </p>
              )}

              <div className="mt-6">
                <ManageSubscriptionButton userId={user.id} />
              </div>
            </div>
          ) : profile?.subscription_status === 'canceled' ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-foreground">Your subscription has been canceled</p>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Canceled
                </span>
              </div>
              {periodEnd && periodEnd > new Date() && (
                <p className="mt-2 text-sm text-muted-foreground">
                  You still have access until{' '}
                  <span className="font-medium">
                    {periodEnd.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </p>
              )}
              <Link
                href="/pricing"
                className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Resubscribe
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-muted-foreground">
                You don't have an active subscription.
              </p>
              <Link
                href="/pricing"
                className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View Plans
              </Link>
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="mt-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400/80">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            disabled
            className="mt-4 px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            Delete Account (Coming Soon)
          </button>
        </section>
      </div>
    </div>
  )
}
