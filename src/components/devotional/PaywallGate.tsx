import Link from 'next/link'

interface Props {
  reason: string
}

export default function PaywallGate({ reason }: Props) {
  const isExpired = reason === 'trial_expired'

  return (
    <div className="mt-10 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-8 text-center">
      <div className="text-4xl mb-4">✝</div>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        {isExpired ? 'Your free trial has ended' : 'This is premium content'}
      </h2>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-pretty">
        {isExpired
          ? 'You had 14 days of free access. Subscribe now to continue reading all devotionals.'
          : 'Subscribe to get full access to this devotional and all others in the archive.'}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pricing"
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          View plans
        </Link>
        <Link
          href="/auth/login"
          className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        Plans start at $9.99/month. Cancel anytime.
      </p>
    </div>
  )
}
