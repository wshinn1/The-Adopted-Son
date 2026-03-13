import { createClient } from '@/lib/supabase/server'
import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, url } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing media ID' }, { status: 400 })
  }

  // Delete from Blob storage
  if (url) {
    try {
      await del(url)
    } catch (e) {
      console.error('Failed to delete blob:', e)
      // Continue anyway — still delete from database
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
