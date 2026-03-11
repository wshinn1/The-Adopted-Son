'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewPagePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Auto-generate slug from title
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generatedSlug)
  }

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Please enter a title and slug')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          title: title.trim(),
          slug: slug.trim(),
          content: {},
          is_published: false,
          is_homepage: false,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/admin/pages/${data.id}/edit`)
    } catch (err: any) {
      console.error('Error creating page:', err)
      if (err.code === '23505') {
        alert('A page with this slug already exists')
      } else {
        alert('Error creating page')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        Create New Page
      </h1>

      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        Create your page first, then you&apos;ll be able to add sections and content.
      </p>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="About Us"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-l-lg border border-r-0 border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="about-us"
                className="flex-1 px-3 py-2 rounded-r-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !slug.trim()}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Page & Add Sections'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-neutral-600 text-sm font-medium hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
