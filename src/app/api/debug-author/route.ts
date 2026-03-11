import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  // Fetch all authors
  const { data: authors, error: authorsError } = await supabaseAdmin
    .from('authors')
    .select('*')
  
  // Fetch a devotional with its author_id
  const { data: devotional, error: devotionalError } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, author_id, author_name')
    .limit(1)
    .single()
  
  // If devotional has author_id, fetch that author
  let linkedAuthor = null
  if (devotional?.author_id) {
    const { data, error } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', devotional.author_id)
      .single()
    linkedAuthor = { data, error: error?.message }
  }
  
  return NextResponse.json({
    authors: { data: authors, error: authorsError?.message },
    devotional: { data: devotional, error: devotionalError?.message },
    linkedAuthor
  })
}
