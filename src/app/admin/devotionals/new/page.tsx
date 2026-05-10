import DevotionalEditor from '@/components/admin/DevotionalEditor'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Devotional — Admin' }

export default async function NewDevotionalPage() {
  const supabase = supabaseAdmin
  
  const { data: authors } = await supabase
    .from('authors')
    .select('id, name, avatar_url')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        New Devotional
      </h1>
      <DevotionalEditor devotional={null} authors={authors || []} />
    </div>
  )
}
