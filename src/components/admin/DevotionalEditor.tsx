'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import BlockEditor from './BlockEditor'

interface Author {
  id: string
  name: string
  avatar_url: string | null
}

interface Devotional {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: unknown
  cover_image_url?: string | null
  cover_image_caption?: string | null
  scripture_reference?: string | null
  scripture_text?: string | null
  category?: string | null
  tags?: string[] | null
  read_time_minutes?: number | null
  is_premium?: boolean
  is_published?: boolean
  is_featured?: boolean
  author_name?: string | null
  author_id?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
}

interface Props {
  devotional: Devotional | null
  authors?: Author[]
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function DevotionalEditor({ devotional, authors = [] }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(devotional?.title ?? '')
  const [slug, setSlug] = useState(devotional?.slug ?? '')
  const [excerpt, setExcerpt] = useState(devotional?.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(devotional?.cover_image_url ?? '')
  const [coverImageCaption, setCoverImageCaption] = useState(devotional?.cover_image_caption ?? '')
  const [scriptureRef, setScriptureRef] = useState(devotional?.scripture_reference ?? '')
  const [scriptureText, setScriptureText] = useState(devotional?.scripture_text ?? '')
  const [category, setCategory] = useState(devotional?.category ?? '')
  const [tagsInput, setTagsInput] = useState(devotional?.tags?.join(', ') ?? '')
  const [readTime, setReadTime] = useState(devotional?.read_time_minutes ?? 5)
  const [isPremium, setIsPremium] = useState(devotional?.is_premium ?? true)
  const [isPublished, setIsPublished] = useState(devotional?.is_published ?? false)
  const [isFeatured, setIsFeatured] = useState(devotional?.is_featured ?? false)
  const [authorId, setAuthorId] = useState(devotional?.author_id ?? '')
  const [authorName, setAuthorName] = useState(devotional?.author_name ?? '')
  const [seoTitle, setSeoTitle] = useState(devotional?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(devotional?.seo_description ?? '')
  const [seoKeywords, setSeoKeywords] = useState(devotional?.seo_keywords ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!devotional)
  const [editorContent, setEditorContent] = useState<unknown>(devotional?.content ?? '')
  const [uploading, setUploading] = useState(false)

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      if (!slugManuallyEdited) {
        setSlug(slugify(value))
      }
    },
    [slugManuallyEdited],
  )

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      setCoverImageUrl(result.url)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (publish: boolean) => {
    // Validate required fields
    if (!coverImageUrl) {
      setError('Featured image is required')
      return
    }

    setSaving(true)
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    // Always ensure slug is URL-safe
    const safeSlug = slugify(slug || title)

    // Get selected author name from authors list
    const selectedAuthor = authors.find(a => a.id === authorId)
    const finalAuthorName = selectedAuthor?.name || authorName || 'The Adopted Son'

    const body = {
      title,
      slug: safeSlug,
      excerpt,
      content: editorContent ?? null,
      cover_image_url: coverImageUrl || null,
      cover_image_caption: coverImageCaption || null,
      scripture_reference: scriptureRef || null,
      scripture_text: scriptureText || null,
      category: category || null,
      tags,
      read_time_minutes: readTime,
      is_premium: isPremium,
      is_published: publish,
      is_featured: isFeatured,
      author_id: authorId || null,
      author_name: finalAuthorName,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      seo_keywords: seoKeywords || null,
      ...(publish && !devotional?.is_published ? { published_at: new Date().toISOString() } : {}),
    }

    const url = devotional
      ? `/api/admin/devotionals/${devotional.id}`
      : '/api/admin/devotionals'

    const res = await fetch(url, {
      method: devotional ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      setSaving(false)
      return
    }

    router.push('/admin/devotionals')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
      {/* Main editor */}
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Devotional title"
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-neutral-400">Slug:</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1"
            />
          </div>
        </div>

        {/* Scripture */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Scripture</h3>
          <input
            type="text"
            value={scriptureRef}
            onChange={(e) => setScriptureRef(e.target.value)}
            placeholder="e.g. Romans 8:15"
            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={scriptureText}
            onChange={(e) => setScriptureText(e.target.value)}
            placeholder="Paste the scripture verse text here..."
            rows={3}
            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Body editor */}
        <BlockEditor
          content={editorContent}
          onChange={setEditorContent}
          placeholder="Write your devotional here... Use the toolbar to add headings, images, videos, columns, and more."
        />

        {/* Short Description / Excerpt */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Short Description</h3>
          <textarea
            value={excerpt}
            onChange={(e) => {
              // Limit to 160 characters (approximately 1-2 sentences)
              if (e.target.value.length <= 160) {
                setExcerpt(e.target.value)
              }
            }}
            placeholder="A brief one-sentence summary shown in post cards and previews..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1.5">
            <p className="text-xs text-neutral-400">Keep it to one sentence for best display</p>
            <span className={`text-xs ${excerpt.length > 140 ? 'text-amber-500' : 'text-neutral-400'}`}>
              {excerpt.length}/160
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Featured Image - Moved to top for visibility */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            Featured Image <span className="text-red-500">*</span>
          </h3>
          {coverImageUrl && coverImageUrl.trim().length > 0 ? (
            <div className="relative">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={coverImageUrl}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => setCoverImageUrl('')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-10"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              {uploading ? (
                <div className="text-sm text-neutral-500">Uploading...</div>
              ) : (
                <>
                  <Upload className="size-8 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-500">Click to upload</span>
                  <span className="text-xs text-neutral-400 mt-1">Required for publishing</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
          )}
          {/* Image Caption */}
          <div className="mt-3">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Image Caption (optional)
            </label>
            <input
              type="text"
              value={coverImageCaption}
              onChange={(e) => setCoverImageCaption(e.target.value)}
              placeholder="Photo credit or description..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Publish */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Publish</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Status</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPublished ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isPublished ? 'Update' : 'Publish'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-2.5 border border-neutral-200 dark:border-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Settings</h3>

          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">Featured post</label>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${isFeatured ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            >
              <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">Premium content</label>
            <button
              type="button"
              onClick={() => setIsPremium(!isPremium)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${isPremium ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            >
              <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${isPremium ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Author</label>
            {authors.length > 0 ? (
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select an author...</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-neutral-500">
                <a href="/admin/authors" className="text-primary-600 underline">Add authors</a> to select from dropdown
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Faith, Identity"
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="grace, adoption, identity"
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-400 mt-1">Comma-separated</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Read time (min)</label>
            <input
              type="number"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value, 10))}
              min={1}
              max={60}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

        </div>

        {/* SEO Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">SEO Settings</h3>
          <p className="text-xs text-neutral-400">Optimize your post for search engines</p>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || 'Custom title for search engines'}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-400 mt-1">Leave empty to use post title</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Meta Description</label>
            <textarea
              value={seoDescription}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setSeoDescription(e.target.value)
                }
              }}
              placeholder={excerpt || 'Description shown in search results'}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-neutral-400">Leave empty to use short description</p>
              <span className={`text-xs ${seoDescription.length > 140 ? 'text-amber-500' : 'text-neutral-400'}`}>
                {seoDescription.length}/160
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Keywords</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="faith, devotional, Christian, prayer"
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-400 mt-1">Comma-separated keywords for search</p>
          </div>
        </div>
      </div>
    </div>
  )
}
