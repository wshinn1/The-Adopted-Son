'use client'

import { signUp } from '@/app/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const redirectTo = plan ? `/subscribe?plan=${plan}` : null

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    // Add redirect URL to form data if present
    if (redirectTo) {
      formData.set('redirectTo', redirectTo)
    }
    
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Create an account
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          {plan ? 'Create your account to continue with subscription' : 'Join The Adopted Son community'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                First name
              </label>
              <input
                type="text"
                name="firstName"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="First"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Last name
              </label>
              <input
                type="text"
                name="lastName"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Last"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating account...' : plan ? 'Create account & continue' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm animate-pulse">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
            <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
            <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
