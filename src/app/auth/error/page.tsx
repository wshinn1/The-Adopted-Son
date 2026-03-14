import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  
  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Authentication error
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Something went wrong during sign in. Please try again.
        </p>
        {reason && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-lg p-3">
            {reason}
          </p>
        )}
        <Link
          href="/auth/login"
          className="mt-6 inline-block px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors text-sm"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
