'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/admin`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Sign in with magic link
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Enter your email and we&apos;ll send you a one-click sign-in link.
        </p>

        {status === 'sent' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              Magic link sent! Check your inbox for <strong>{email}</strong> and click the link to sign in.
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              Didn&apos;t receive it?{' '}
              <button
                onClick={() => setStatus('idle')}
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
              >
                {status === 'loading' ? 'Sending...' : 'Send magic link'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
