import DevotionalEditor from '@/components/admin/DevotionalEditor'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Edit Devotional — Admin' }

export default async function EditDevotionalPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: devotional }, { data: authors }] = await Promise.all([
    supabase
      .from('devotionals')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('authors')
      .select('id, name, avatar_url')
      .eq('is_active', true)
      .order('name', { ascending: true })
  ])

  if (!devotional) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        Edit Devotional
      </h1>
      <DevotionalEditor devotional={devotional} authors={authors || []} />
    </div>
  )
}
