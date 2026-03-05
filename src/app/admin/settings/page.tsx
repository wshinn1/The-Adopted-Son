import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings — Admin' }

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Settings</h1>

      <div className="max-w-xl space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Stripe Integration</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            After creating your Stripe products, add the price IDs as environment variables:
          </p>
          <ul className="space-y-2 text-sm font-mono text-neutral-600 dark:text-neutral-400">
            <li className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">STRIPE_PRICE_MONTHLY</li>
            <li className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">STRIPE_PRICE_ANNUAL</li>
            <li className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">STRIPE_WEBHOOK_SECRET</li>
            <li className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">NEXT_PUBLIC_APP_URL</li>
          </ul>
          <p className="text-xs text-neutral-400 mt-3">
            Add these in the Vars section of v0 settings (top right).
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Make yourself admin</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Run this SQL in your Supabase dashboard to make your account an admin:
          </p>
          <pre className="mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto">
            {`UPDATE public.profiles\nSET is_admin = true\nWHERE email = 'your@email.com';`}
          </pre>
        </div>
      </div>
    </div>
  )
}
