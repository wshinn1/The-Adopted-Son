'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Trash2 } from 'lucide-react'

interface NavLink {
  label: string
  url: string
  bg_color?: string
  text_color?: string
}

interface Page {
  id: string
  title: string
  slug: string
  is_homepage: boolean
}

export default function MenuNavigationPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [navLinks, setNavLinks] = useState<NavLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load nav links setting
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'nav_links')
        .single()

      if (settingsData) {
        try {
          const parsed = typeof settingsData.value === 'string' 
            ? JSON.parse(settingsData.value) 
            : settingsData.value
          setNavLinks(parsed || [{ label: 'Home', url: '/' }])
        } catch {
          setNavLinks([{ label: 'Home', url: '/' }])
        }
      } else {
        setNavLinks([{ label: 'Home', url: '/' }])
      }

      // Load pages for dropdown
      const { data: pagesData } = await supabase
        .from('pages')
        .select('id, title, slug, is_homepage')
        .order('title')

      setPages(pagesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'nav_links', value: JSON.stringify(navLinks) }, { onConflict: 'key' })

      if (error) throw error

      // Revalidate all public pages so the new nav order appears immediately
      await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/devotionals', '/about', '/give', '/contact'] }),
      })

      showNotification('Menu saved successfully!')
    } catch (err) {
      console.error('Error saving menu:', err)
      showNotification('Error saving menu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addNavLink = () => {
    setNavLinks([...navLinks, { label: '', url: '' }])
  }

  const updateNavLink = (index: number, field: 'label' | 'url' | 'bg_color' | 'text_color', value: string) => {
    const updated = [...navLinks]
    updated[index][field] = value
    setNavLinks(updated)
  }

  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index))
  }

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === navLinks.length - 1)
    ) {
      return
    }
    const updated = [...navLinks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setNavLinks(updated)
  }

  if (loading) {
    return <div className="py-8 text-center text-neutral-500">Loading menu...</div>
  }

  return (
    <div className="max-w-2xl">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Menu Navigation
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Menu'}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Navigation Links</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Configure the links that appear in your site header navigation.
            </p>
          </div>
          <button
            onClick={addNavLink}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="size-4" />
            Add Link
          </button>
        </div>

        <div className="space-y-3">
          {navLinks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No navigation links yet. Click "Add Link" to get started.
            </div>
          ) : (
            navLinks.map((link, index) => (
              <div key={index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveLink(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveLink(index, 'down')}
                      disabled={index === navLinks.length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Label</label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateNavLink(index, 'label', e.target.value)}
                          placeholder="Link text"
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Quick pick a page</label>
                        <select
                          value=""
                          onChange={(e) => {
                            const value = e.target.value
                            if (!value) return
                            updateNavLink(index, 'url', value)
                            if (!link.label) {
                              const builtIn: Record<string, string> = { '/': 'Home', '/devotionals': 'Devotionals', '/give': 'Give' }
                              if (builtIn[value]) {
                                updateNavLink(index, 'label', builtIn[value])
                              } else {
                                const page = pages.find(p => p.is_homepage ? value === '/' : `/${p.slug}` === value)
                                if (page) updateNavLink(index, 'label', page.title)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm"
                        >
                          <option value="">— choose to fill URL —</option>
                          <optgroup label="Built-in routes">
                            <option value="/">Home ( / )</option>
                            <option value="/devotionals">Devotionals ( /devotionals )</option>
                            <option value="/give">Give ( /give )</option>
                          </optgroup>
                          {pages.length > 0 && (
                            <optgroup label="Your pages">
                              {pages.map((page) => {
                                const path = page.is_homepage ? '/' : `/${page.slug}`
                                return (
                                  <option key={page.id} value={path}>
                                    {page.title} ( {path} )
                                  </option>
                                )
                              })}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">URL</label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateNavLink(index, 'url', e.target.value)}
                        placeholder="/your-page or https://external.com"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeNavLink(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Remove link"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Button styling row */}
                <div className="flex items-center gap-4 pl-10 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <span className="text-xs text-neutral-500 shrink-0">Button style</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-500">Background</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={link.bg_color || '#ffffff'}
                        onChange={(e) => updateNavLink(index, 'bg_color', e.target.value)}
                        className="h-7 w-10 rounded cursor-pointer border border-neutral-200 dark:border-neutral-600"
                      />
                      <input
                        type="text"
                        value={link.bg_color || ''}
                        onChange={(e) => updateNavLink(index, 'bg_color', e.target.value)}
                        placeholder="none"
                        className="w-20 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
                      />
                      {link.bg_color && (
                        <button
                          onClick={() => updateNavLink(index, 'bg_color', '')}
                          className="text-xs text-neutral-400 hover:text-neutral-600 px-1"
                          title="Remove background color"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-500">Text</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={link.text_color || '#000000'}
                        onChange={(e) => updateNavLink(index, 'text_color', e.target.value)}
                        className="h-7 w-10 rounded cursor-pointer border border-neutral-200 dark:border-neutral-600"
                      />
                      <input
                        type="text"
                        value={link.text_color || ''}
                        onChange={(e) => updateNavLink(index, 'text_color', e.target.value)}
                        placeholder="none"
                        className="w-20 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs"
                      />
                      {link.text_color && (
                        <button
                          onClick={() => updateNavLink(index, 'text_color', '')}
                          className="text-xs text-neutral-400 hover:text-neutral-600 px-1"
                          title="Remove text color"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Live preview */}
                  {link.bg_color && (
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: link.bg_color,
                        color: link.text_color || '#000000',
                      }}
                    >
                      {link.label || 'Preview'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {navLinks.length > 0 && (
          <p className="text-xs text-neutral-500 mt-4">
            Drag links to reorder them, or use the arrow buttons.
          </p>
        )}
      </div>
    </div>
  )
}
