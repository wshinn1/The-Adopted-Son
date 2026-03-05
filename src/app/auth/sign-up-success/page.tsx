import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Check your email
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
          We sent a confirmation link to your email. Click the link to activate your account, then sign in.
        </p>
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
