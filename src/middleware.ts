import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const isEmbed = request.nextUrl.pathname.startsWith('/embed/')

  if (isEmbed) {
    // Pass embed routes through with a flag — no auth session needed
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-is-embed', '1')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
