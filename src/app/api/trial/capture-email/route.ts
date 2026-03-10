import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const { email, ip } = await request.json()

  if (!email || !ip) {
    return NextResponse.json({ error: 'Missing email or ip' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('visitor_trials')
    .update({ email })
    .eq('ip_address', ip)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
