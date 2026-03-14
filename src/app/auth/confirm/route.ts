import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  
  // Log all params for debugging
  console.log('[v0] Auth confirm request:', { 
    url: request.url,
    token_hash: token_hash ? 'present' : 'missing', 
    type, 
    code: code ? 'present' : 'missing',
    next,
  })

  const supabase = await createClient()

  // Handle email confirmation via token_hash (signup, password reset, etc.)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[v0] Email verification error:', error.message)
    return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error.message)}`)
  }

  // Handle PKCE flow via code (OAuth, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[v0] Code exchange error:', error.message)
    return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error.message)}`)
  }

  // No valid parameters found - this means Supabase redirected without token/code
  console.log('[v0] No valid auth params found in URL')
  return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent('No authentication token received. The confirmation link may have expired or already been used.')}`)
}
