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

interface NavTypography {
  fontClass: string
  fontWeight: string
  fontSize: string
  letterSpacing: string
  textTransform: string
}

interface NavScroll {
  initialOpacity: number
  scrolledOpacity: number
  blurAmount: number
}

const DEFAULT_TYPOGRAPHY: NavTypography = {
  fontClass: '',
  fontWeight: '500',
  fontSize: '14',
  letterSpacing: 'normal',
  textTransform: 'none',
}

const DEFAULT_SCROLL: NavScroll = {
  initialOpacity: 0,
  scrolledOpacity: 90,
  blurAmount: 12,
}

export default function MenuNavigationPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [navLinks, setNavLinks] = useState<NavLink[]>([])
  const [typography, setTypography] = useState<NavTypography>(DEFAULT_TYPOGRAPHY)
  const [scroll, setScroll] = useState<NavScroll>(DEFAULT_SCROLL)
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

  useEffect(() => { loadData() }, [])

  const parseObj = (raw: any, fallback: any) => {
    try {
      const v = typeof raw === 'string' ? JSON.parse(raw) : raw
      return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
    } catch { return fallback }
  }

  const loadData = async () => {
    try {
      const { data: rows } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['nav_links', 'nav_typography', 'nav_scroll'])

      const s: Record<string, any> = {}
      for (const r of rows ?? []) s[r.key] = r.value

      const parsed = typeof s['nav_links'] === 'string' ? JSON.parse(s['nav_links']) : s['nav_links']
      setNavLinks(Array.isArray(parsed) ? parsed : [{ label: 'Home', url: '/' }])
      setTypography({ ...DEFAULT_TYPOGRAPHY, ...parseObj(s['nav_typography'], {}) })
      setScroll({ ...DEFAULT_SCROLL, ...parseObj(s['nav_scroll'], {}) })

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
      await Promise.all([
        supabase.from('site_settings').upsert({ key: 'nav_links', value: JSON.stringify(navLinks) }, { onConflict: 'key' }),
        supabase.from('site_settings').upsert({ key: 'nav_typography', value: JSON.stringify(typography) }, { onConflict: 'key' }),
        supabase.from('site_settings').upsert({ key: 'nav_scroll', value: JSON.stringify(scroll) }, { onConflict: 'key' }),
      ])

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

  const addNavLink = () => setNavLinks([...navLinks, { label: '', url: '' }])

  const updateNavLink = (index: number, field: keyof NavLink, value: string) => {
    const updated = [...navLinks]
    updated[index] = { ...updated[index], [field]: value }
    setNavLinks(updated)
  }

  const removeNavLink = (index: number) => setNavLinks(navLinks.filter((_, i) => i !== index))

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === navLinks.length - 1)) return
    const updated = [...navLinks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setNavLinks(updated)
  }

  const setTypographyField = <K extends keyof NavTypography>(field: K, value: NavTypography[K]) =>
    setTypography(t => ({ ...t, [field]: value }))

  const setScrollField = <K extends keyof NavScroll>(field: K, value: NavScroll[K]) =>
    setScroll(s => ({ ...s, [field]: value }))

  // Live preview style
  const previewStyle: React.CSSProperties = {
    fontWeight: typography.fontWeight,
    fontSize: `${typography.fontSize}px`,
    letterSpacing: typography.letterSpacing === 'normal' ? '0em'
      : typography.letterSpacing === 'wide' ? '0.05em'
      : typography.letterSpacing === 'wider' ? '0.1em'
      : '0.2em',
    textTransform: typography.textTransform as any,
  }

  if (loading) return <div className="py-8 text-center text-neutral-500">Loading menu...</div>

  return (
    <div className="max-w-2xl">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Menu Navigation</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* ── NAV LINKS ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Navigation Links</h2>
            <p className="text-sm text-neutral-500 mt-1">Configure the links in your site header. On desktop, any link with a background color becomes a CTA button on the right.</p>
          </div>
          <button onClick={addNavLink} className="flex items-center gap-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="size-4" />
            Add Link
          </button>
        </div>

        <div className="space-y-3">
          {navLinks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No navigation links yet. Click "Add Link" to get started.</div>
          ) : (
            navLinks.map((link, index) => (
              <div key={index} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30" title="Move up">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveLink(index, 'down')} disabled={index === navLinks.length - 1} className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30" title="Move down">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Label</label>
                        <input type="text" value={link.label} onChange={(e) => updateNavLink(index, 'label', e.target.value)} placeholder="Link text" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm" />
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
                                return <option key={page.id} value={path}>{page.title} ( {path} )</option>
                              })}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">URL</label>
                      <input type="text" value={link.url} onChange={(e) => updateNavLink(index, 'url', e.target.value)} placeholder="/your-page or https://external.com" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono" />
                    </div>
                  </div>

                  <button onClick={() => removeNavLink(index)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Remove link">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Button styling */}
                <div className="flex items-center gap-4 pl-10 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <span className="text-xs text-neutral-500 shrink-0">Button style</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-500">Background</label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={link.bg_color || '#ffffff'} onChange={(e) => updateNavLink(index, 'bg_color', e.target.value)} className="h-7 w-10 rounded cursor-pointer border border-neutral-200 dark:border-neutral-600" />
                      <input type="text" value={link.bg_color || ''} onChange={(e) => updateNavLink(index, 'bg_color', e.target.value)} placeholder="none" className="w-20 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs" />
                      {link.bg_color && <button onClick={() => updateNavLink(index, 'bg_color', '')} className="text-xs text-neutral-400 hover:text-neutral-600 px-1" title="Remove">✕</button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-500">Text</label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={link.text_color || '#000000'} onChange={(e) => updateNavLink(index, 'text_color', e.target.value)} className="h-7 w-10 rounded cursor-pointer border border-neutral-200 dark:border-neutral-600" />
                      <input type="text" value={link.text_color || ''} onChange={(e) => updateNavLink(index, 'text_color', e.target.value)} placeholder="none" className="w-20 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs" />
                      {link.text_color && <button onClick={() => updateNavLink(index, 'text_color', '')} className="text-xs text-neutral-400 hover:text-neutral-600 px-1" title="Remove">✕</button>}
                    </div>
                  </div>
                  {link.bg_color && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: link.bg_color, color: link.text_color || '#000' }}>
                      {link.label || 'Preview'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── TYPOGRAPHY ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Desktop Nav Typography</h2>
        <p className="text-sm text-neutral-500 mb-5">Controls the appearance of navigation links on desktop. Mobile links always use the heading font.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Font</label>
            <select
              value={typography.fontClass}
              onChange={(e) => setTypographyField('fontClass', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="">Body (default)</option>
              <option value="font-heading">Heading font</option>
              <option value="font-sans">Sans-serif</option>
              <option value="font-serif">Serif</option>
              <option value="font-mono">Monospace</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Weight</label>
            <select
              value={typography.fontWeight}
              onChange={(e) => setTypographyField('fontWeight', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Size</label>
            <select
              value={typography.fontSize}
              onChange={(e) => setTypographyField('fontSize', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="12">12px — XS</option>
              <option value="13">13px — Small</option>
              <option value="14">14px — Default</option>
              <option value="15">15px</option>
              <option value="16">16px — Base</option>
              <option value="18">18px — Large</option>
              <option value="20">20px — XL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Letter Spacing</label>
            <select
              value={typography.letterSpacing}
              onChange={(e) => setTypographyField('letterSpacing', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
              <option value="wider">Wider</option>
              <option value="widest">Widest</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Text Transform</label>
            <select
              value={typography.textTransform}
              onChange={(e) => setTypographyField('textTransform', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              <option value="none">None</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="capitalize">Capitalize</option>
              <option value="lowercase">lowercase</option>
            </select>
          </div>

          {/* Live preview */}
          <div className="flex flex-col justify-end">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Preview</label>
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex items-center gap-5">
              {navLinks.slice(0, 3).map((l, i) => (
                <span key={i} className={`text-neutral-700 ${typography.fontClass}`} style={previewStyle}>
                  {l.label || `Link ${i + 1}`}
                </span>
              ))}
              {navLinks.length === 0 && <span className={`text-neutral-700 ${typography.fontClass}`} style={previewStyle}>About</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLL BEHAVIOR ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Desktop Nav Scroll Behavior</h2>
        <p className="text-sm text-neutral-500 mb-5">Controls how the desktop navigation header looks as the user scrolls. Set initial opacity to 0 for a fully transparent header at page top.</p>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Background opacity at page top</label>
              <span className="text-xs font-mono text-neutral-500">{scroll.initialOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={scroll.initialOpacity}
              onChange={(e) => setScrollField('initialOpacity', Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Background opacity when scrolled</label>
              <span className="text-xs font-mono text-neutral-500">{scroll.scrolledOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={scroll.scrolledOpacity}
              onChange={(e) => setScrollField('scrolledOpacity', Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Blur amount when scrolled</label>
              <span className="text-xs font-mono text-neutral-500">{scroll.blurAmount}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={scroll.blurAmount}
              onChange={(e) => setScrollField('blurAmount', Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-0.5">
              <span>No blur</span>
              <span>Max blur</span>
            </div>
          </div>

          {/* Visual preview */}
          <div className="relative h-20 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-200 via-purple-200 to-rose-200" />
            <div className="absolute inset-x-0 top-0 h-12 flex items-center px-4 gap-6">
              <div className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `rgba(255,255,255,${scroll.scrolledOpacity/100})`, backdropFilter: `blur(${scroll.blurAmount}px)` }}>
                Logo
              </div>
              <div className="flex gap-3 items-center">
                {['About', 'Links', 'Contact'].map(l => (
                  <span key={l} className="text-xs text-neutral-700" style={previewStyle}>{l}</span>
                ))}
              </div>
            </div>
            <p className="absolute bottom-1 right-2 text-xs text-neutral-400">scrolled preview</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
