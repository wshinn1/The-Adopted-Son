'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Trash2 } from 'lucide-react'

interface Page {
  id: string
  title: string
  slug: string
  is_published: boolean
  is_homepage: boolean
}

interface Props {
  initialPages: Page[]
}

export default function PagesTable({ initialPages }: Props) {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageToDelete = pages.find((p) => p.id === confirmId)

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/pages/${confirmId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to delete page.')
      } else {
        setPages((prev) => prev.filter((p) => p.id !== confirmId))
        setConfirmId(null)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
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
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                  <span className="flex items-center gap-2">
                    {page.is_homepage && <Home className="size-4 text-primary-600" />}
                    {page.title}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-neutral-500">
                  {page.is_homepage ? '/ (homepage)' : `/${page.slug}`}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${page.is_published ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-neutral-100 text-neutral-500'}`}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/pages/${page.id}/edit`}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit
                    </Link>
                    {!page.is_homepage && (
                      <button
                        onClick={() => setConfirmId(page.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">
                  No pages yet. Create your first page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm delete dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Delete &quot;{pageToDelete?.title}&quot;?
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              This will permanently delete the page and all its sections. This action cannot be undone.
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setConfirmId(null); setError(null) }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
