'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Author {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  email: string | null
  website_url: string | null
  social_twitter: string | null
  social_instagram: string | null
  is_active: boolean
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [socialTwitter, setSocialTwitter] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [isActive, setIsActive] = useState(true)

  const supabase = createClient()

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching authors:', error)
      showNotification('Failed to load authors', 'error')
    } else {
      setAuthors(data || [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setBio('')
    setAvatarUrl('')
    setEmail('')
    setWebsiteUrl('')
    setSocialTwitter('')
    setSocialInstagram('')
    setIsActive(true)
    setEditingAuthor(null)
  }

  const openModal = (author?: Author) => {
    if (author) {
      setEditingAuthor(author)
      setName(author.name)
      setSlug(author.slug)
      setBio(author.bio || '')
      setAvatarUrl(author.avatar_url || '')
      setEmail(author.email || '')
      setWebsiteUrl(author.website_url || '')
      setSocialTwitter(author.social_twitter || '')
      setSocialInstagram(author.social_instagram || '')
      setIsActive(author.is_active)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

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
      setAvatarUrl(result.url)
    } catch (err) {
      console.error('Upload error:', err)
      showNotification('Failed to upload image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification('Name is required', 'error')
      return
    }

    setSaving(true)

    const authorData = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      email: email.trim() || null,
      website_url: websiteUrl.trim() || null,
      social_twitter: socialTwitter.trim() || null,
      social_instagram: socialInstagram.trim() || null,
      is_active: isActive,
    }

    try {
      if (editingAuthor) {
        const { error } = await supabase
          .from('authors')
          .update(authorData)
          .eq('id', editingAuthor.id)

        if (error) throw error
        showNotification('Author updated successfully')
      } else {
        const { error } = await supabase
          .from('authors')
          .insert(authorData)

        if (error) throw error
        showNotification('Author created successfully')
      }

      closeModal()
      fetchAuthors()
    } catch (err: any) {
      console.error('Error saving author:', err)
      showNotification(err.message || 'Failed to save author', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (author: Author) => {
    if (!confirm(`Are you sure you want to delete "${author.name}"?`)) return

    try {
      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', author.id)

      if (error) throw error
      showNotification('Author deleted successfully')
      fetchAuthors()
    } catch (err: any) {
      console.error('Error deleting author:', err)
      showNotification(err.message || 'Failed to delete author', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Authors</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="size-4" />
          Add Author
        </button>
      </div>

      {/* Authors Grid */}
      {loading ? (
        <div className="text-center py-12 text-neutral-500">Loading authors...</div>
      ) : authors.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-12 text-center">
          <p className="text-neutral-500 mb-4">No authors yet. Create your first author profile.</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700"
          >
            Add Author
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <div
              key={author.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="size-16 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                  {author.avatar_url ? (
                    <Image
                      src={author.avatar_url}
                      alt={author.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-neutral-400">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {author.name}
                  </h3>
                  <p className="text-sm text-neutral-500 truncate">/{author.slug}</p>
                  {author.bio && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                      {author.bio}
                    </p>
                  )}
                  {!author.is_active && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => openModal(author)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(author)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingAuthor ? 'Edit Author' : 'Add New Author'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-neutral-400">
                        {name ? name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-sm rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <Upload className="size-4" />
                        {uploading ? 'Uploading...' : 'Upload image'}
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
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!editingAuthor) {
                      setSlug(slugify(e.target.value))
                    }
                  }}
                  placeholder="Author name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="author-slug"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short biography..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="author@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    isActive ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingAuthor ? 'Update Author' : 'Create Author'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
