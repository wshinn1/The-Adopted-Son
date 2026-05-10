import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { paths } = await request.json().catch(() => ({ paths: ['/'] }))
  const toRevalidate: string[] = paths ?? ['/']

  for (const p of toRevalidate) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: toRevalidate })
}
