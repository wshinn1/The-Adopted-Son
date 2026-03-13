'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MediaItem {
  id: string
  filename: string
  original_name?: string
  blob_url?: string
  blob_pathname?: string
  mime_type?: string
  // Legacy column names from old uploads
  url?: string
  pathname?: string
  content_type?: string
  alt_text: string | null
  size_bytes: number | null
  created_at: string
}

export default function MediaCard({ item }: { item: MediaItem }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [altText, setAltText] = useState(item.alt_text ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Support both new and legacy column names
  const imageUrl = item.blob_url || item.url || ''
  const mimeType = item.mime_type || item.content_type || ''

  const copyUrl = async () => {
    await navigator.clipboard.writeText(imageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveAltText = async () => {
    setSaving(true)
    await fetch('/api/media/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, alt_text: altText }),
    })
    setSaving(false)
    setIsEditing(false)
    router.refresh()
  }

  const deleteMedia = async () => {
    if (!confirm('Delete this media file?')) return
    await fetch('/api/media/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, url: imageUrl }),
    })
    router.refresh()
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      {/* Image preview */}
      <div className="aspect-square relative bg-neutral-200 dark:bg-neutral-700">
        {imageUrl && mimeType?.startsWith('image/') ? (
          <Image
            src={imageUrl}
            alt={item.alt_text ?? item.filename}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-neutral-400">
            {mimeType?.startsWith('video/') ? '▶' : '▣'}
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
          <button
            onClick={copyUrl}
            className="w-full text-xs bg-white text-neutral-900 px-3 py-1.5 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="w-full text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Edit Details
          </button>
          <button
            onClick={deleteMedia}
            className="w-full text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate" title={item.filename}>
          {item.filename}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">{formatSize(item.size_bytes)}</p>
        {item.alt_text && (
          <p className="text-xs text-neutral-400 mt-1 truncate" title={item.alt_text}>
            Alt: {item.alt_text}
          </p>
        )}
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsEditing(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Edit Media Details
            </h3>
            
            {/* Preview */}
            {imageUrl && mimeType?.startsWith('image/') && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-neutral-100 dark:bg-neutral-800">
                <Image src={imageUrl} alt={item.alt_text ?? item.filename} fill className="object-contain" unoptimized />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={item.filename}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Alt Text / Description
                </label>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image for accessibility..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Alt text helps screen readers describe images to visually impaired users.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    disabled
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-sm truncate"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAltText}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
