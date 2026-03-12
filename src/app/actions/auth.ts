'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect(redirectTo ?? '/account')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  
  // If there's a redirect (e.g., to subscribe page), include it in the email confirmation link
  const emailRedirectTo = redirectTo 
    ? `${origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/confirm`

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { 
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      },
    },
  })

  if (error) return { error: error.message }
  redirect('/auth/sign-up-success')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
