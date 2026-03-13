import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Prevent deleting the homepage
  const { data: page } = await supabase
    .from('pages')
    .select('is_homepage')
    .eq('id', id)
    .single()

  if (page?.is_homepage) {
    return NextResponse.json({ error: 'The homepage cannot be deleted.' }, { status: 400 })
  }

  const { error } = await supabase.from('pages').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
