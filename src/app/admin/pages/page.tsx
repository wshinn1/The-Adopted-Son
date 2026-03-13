import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'
import PagesTable from '@/components/admin/PagesTable'

export const metadata: Metadata = { title: 'Pages — Admin' }

export default async function AdminPagesPage() {
  const supabase = await createClient()

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .order('is_homepage', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Pages</h1>
        <Link
          href="/admin/pages/new"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          + New Page
        </Link>
      </div>

      <PagesTable initialPages={pages ?? []} />
    </div>
  )
}
