import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pages — Admin' }

export default async function AdminPagesPage() {
  const supabase = await createClient()

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
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

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pages?.map((page) => (
              <tr key={page.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">{page.title}</td>
                <td className="px-5 py-3.5 text-neutral-500">/{page.slug}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${page.is_published ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-neutral-100 text-neutral-500'}`}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/admin/pages/${page.id}/edit`} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
