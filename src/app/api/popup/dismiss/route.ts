import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const ipHash = hashIP(ip)
    
    const body = await request.json()
    const subscribed = body.subscribed === true

    const { error } = await supabaseAdmin
      .from('popup_dismissals')
      .insert({
        ip_hash: ipHash,
        subscribed,
        dismissed_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error recording popup dismissal:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in popup dismiss:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
