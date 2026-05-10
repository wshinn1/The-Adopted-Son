import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Metadata } from 'next'
import AdminDevotionalActions from '@/components/admin/AdminDevotionalActions'
import GenerateAllAudioButton from '@/components/admin/GenerateAllAudioButton'

export const metadata: Metadata = { title: 'Devotionals — Admin' }

export default async function AdminDevotionalsPage() {
  const supabase = supabaseAdmin

  const { data: devotionals } = await supabase
    .from('devotionals')
    .select('id, title, slug, is_published, is_premium, category, published_at, created_at, tts_audio_url')
    .order('created_at', { ascending: false })

  const allDevotionalsForTTS = (devotionals ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    hasAudio: !!d.tts_audio_url,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Devotionals</h1>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <GenerateAllAudioButton devotionals={allDevotionalsForTTS} />
          <Link
            href="/admin/devotionals/new"
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            + New Devotional
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Audio</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {devotionals?.map((d) => (
              <tr key={d.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[220px]">
                    {d.title}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">/devotionals/{d.slug}</p>
                </td>
                <td className="px-5 py-3.5 text-neutral-500 hidden md:table-cell">
                  {d.category ?? '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.is_published
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {d.is_published ? 'Published' : 'Draft'}
                    </span>
                    {d.is_premium && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        Premium
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  {d.tts_audio_url ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Ready</span>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-neutral-400 text-xs hidden lg:table-cell">
                  {d.published_at
                    ? new Date(d.published_at).toLocaleDateString()
                    : new Date(d.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 justify-end">
                    <Link
                      href={`/devotionals/${d.slug}`}
                      target="_blank"
                      className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/devotionals/${d.id}/edit`}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit
                    </Link>
                    <AdminDevotionalActions devotionalId={d.id} slug={d.slug} />
                  </div>
                </td>
              </tr>
            ))}
            {(!devotionals || devotionals.length === 0) && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-neutral-400">
                  No devotionals yet.{' '}
                  <Link href="/admin/devotionals/new" className="text-primary-600">
                    Create your first one
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
