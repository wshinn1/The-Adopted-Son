import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Forbidden', supabase: null }
  return { error: null, supabase }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await request.json()

  const { data, error: dbError } = await supabase
    .from('devotionals')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ devotional: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const { error: dbError } = await supabase.from('devotionals').delete().eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
