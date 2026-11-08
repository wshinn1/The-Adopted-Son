'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Trash2, Upload, Image as ImageIcon, FileText, Link2 } from 'lucide-react'

interface SocialLink { platform: string; url: string }
interface FooterNavLink { label: string; url: string }
interface FooterNavColumn { title: string; title_color: string; link_color: string; links: FooterNavLink[] }
interface FooterImage { url: string; alt: string }
interface LegalLink { label: string; url: string }
interface SitePage { id: string; title: string; slug: string; is_homepage: boolean }

interface FooterConfig {
  bg_color: string
  text_color: string
  divider_color: string
  tagline: string
  social_links: SocialLink[]
  nav_columns: FooterNavColumn[]
  images: FooterImage[]
  copyright_text: string
  legal_links: LegalLink[]
  show_on_devotionals: boolean
}

const DEFAULT: FooterConfig = {
  bg_color: '#ffffff',
  text_color: '#1a1a1a',
  divider_color: '#e5e7eb',
  tagline: '',
  social_links: [],
  nav_columns: [],
  images: [{ url: '', alt: '' }, { url: '', alt: '' }, { url: '', alt: '' }, { url: '', alt: '' }],
  copyright_text: '',
  legal_links: [],
  show_on_devotionals: false,
}

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'youtube', 'linkedin']

/* Fixed routes that don't come from the pages table */
const FIXED_ROUTES = [
  { label: 'Devotionals', url: '/devotionals' },
  { label: 'About', url: '/about' },
  { label: 'Give / Giving', url: '/give' },
  { label: 'Contact', url: '/contact' },
  { label: 'Authors', url: '/authors' },
  { label: 'Categories', url: '/categories' },
  { label: 'Tags', url: '/tags' },
]

/* ── Link row: page-picker or custom ── */
function LinkRow({
  link,
  pages,
  onChange,
  onRemove,
}: {
  link: FooterNavLink
  pages: SitePage[]
  onChange: (patch: Partial<FooterNavLink>) => void
  onRemove: () => void
}) {
  const [mode, setMode] = useState<'page' | 'custom'>('custom')

  /* Derive a "page url" string for the select */
  const pageOptions = [
    ...pages.map(p => ({ label: p.title, url: p.is_homepage ? '/' : `/${p.slug}` })),
    ...FIXED_ROUTES,
  ]

  const handlePageSelect = (url: string) => {
    const opt = pageOptions.find(o => o.url === url)
    onChange({ url, label: link.label || (opt?.label ?? '') })
  }

  const inputCls = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none'

  return (
    <div className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-white p-2.5">
      {/* Mode toggle */}
      <div className="flex shrink-0 rounded-md border border-neutral-200 overflow-hidden text-xs mt-0.5">
        <button
          type="button"
          onClick={() => setMode('page')}
          title="Pick a site page"
          className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${mode === 'page' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
        >
          <FileText className="size-3" />
          Page
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          title="Custom URL"
          className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${mode === 'custom' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
        >
          <Link2 className="size-3" />
          Custom
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Label */}
        <input
          type="text"
          value={link.label}
          onChange={e => onChange({ label: e.target.value })}
          placeholder="Label"
          className={inputCls}
        />

        {/* URL — either a select or free-form */}
        {mode === 'page' ? (
          <select
            value={link.url}
            onChange={e => handlePageSelect(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">— choose page —</option>
            <optgroup label="Site Pages">
              {pages.map(p => (
                <option key={p.id} value={p.is_homepage ? '/' : `/${p.slug}`}>
                  {p.title}{p.is_homepage ? ' (Home)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Built-in routes">
              {FIXED_ROUTES.map(r => (
                <option key={r.url} value={r.url}>{r.label}</option>
              ))}
            </optgroup>
          </select>
        ) : (
          <input
            type="text"
            value={link.url}
            onChange={e => onChange({ url: e.target.value })}
            placeholder="/path or https://..."
            className={inputCls}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 mt-1 text-red-400 hover:text-red-600"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

/* ── Main page ── */
export default function FooterAdminPage() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT)
  const [pages, setPages] = useState<SitePage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState<number | null>(null)
  const [mediaItems, setMediaItems] = useState<{ id: string; url: string; filename: string }[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [{ data: configRow }, { data: pagesData }] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'footer_config').single(),
        supabase.from('pages').select('id, title, slug, is_homepage').order('title'),
      ])

      if (configRow?.value) {
        const parsed = typeof configRow.value === 'string' ? JSON.parse(configRow.value) : configRow.value
        setConfig({ ...DEFAULT, ...parsed })
      }
      setPages(pagesData || [])
    } catch {
      // first load with no config yet
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'footer_config', value: config }, { onConflict: 'key' })
      if (error) throw error
      showNotification('Footer saved successfully!')
    } catch (e: any) {
      showNotification(e.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = (patch: Partial<FooterConfig>) => setConfig(prev => ({ ...prev, ...patch }))

  /* ── Social links ── */
  const addSocial = () => set({ social_links: [...config.social_links, { platform: 'twitter', url: '' }] })
  const removeSocial = (i: number) => set({ social_links: config.social_links.filter((_, j) => j !== i) })
  const updateSocial = (i: number, patch: Partial<SocialLink>) =>
    set({ social_links: config.social_links.map((s, j) => j === i ? { ...s, ...patch } : s) })

  /* ── Nav columns ── */
  const addColumn = () => set({ nav_columns: [...config.nav_columns, { title: 'Column', title_color: '', link_color: '', links: [] }] })
  const removeColumn = (i: number) => set({ nav_columns: config.nav_columns.filter((_, j) => j !== i) })
  const updateColumn = (i: number, patch: Partial<FooterNavColumn>) =>
    set({ nav_columns: config.nav_columns.map((c, j) => j === i ? { ...c, ...patch } : c) })
  const addColumnLink = (ci: number) => updateColumn(ci, { links: [...config.nav_columns[ci].links, { label: '', url: '' }] })
  const removeColumnLink = (ci: number, li: number) =>
    updateColumn(ci, { links: config.nav_columns[ci].links.filter((_, j) => j !== li) })
  const updateColumnLink = (ci: number, li: number, patch: Partial<FooterNavLink>) =>
    updateColumn(ci, { links: config.nav_columns[ci].links.map((l, j) => j === li ? { ...l, ...patch } : l) })

  /* ── Images ── */
  const updateImage = (i: number, patch: Partial<FooterImage>) =>
    set({ images: config.images.map((img, j) => j === i ? { ...img, ...patch } : img) })

  const uploadImage = async (i: number, file: File) => {
    setUploadingIdx(i)
    try {
      const ext = file.name.split('.').pop()
      const filename = `footer-${Date.now()}-${i}.${ext}`
      const { data, error } = await supabase.storage.from('media').upload(filename, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path)
      updateImage(i, { url: publicUrl })
    } catch (e: any) {
      showNotification(e.message || 'Upload failed', 'error')
    } finally {
      setUploadingIdx(null)
    }
  }

  const openMediaPicker = async (i: number) => {
    setShowMediaPicker(i)
    const { data } = await supabase.from('media').select('id, url, filename, content_type').order('created_at', { ascending: false }).limit(50)
    setMediaItems((data || []).filter((m: any) => m.content_type?.startsWith('image/')))
  }

  /* ── Legal links ── */
  const addLegal = () => set({ legal_links: [...config.legal_links, { label: '', url: '' }] })
  const removeLegal = (i: number) => set({ legal_links: config.legal_links.filter((_, j) => j !== i) })
  const updateLegal = (i: number, patch: Partial<LegalLink>) =>
    set({ legal_links: config.legal_links.map((l, j) => j === i ? { ...l, ...patch } : l) })

  if (loading) {
    return <div className="p-8 text-neutral-500">Loading footer settings…</div>
  }

  const inputCls = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none'
  const labelCls = 'block text-xs font-medium text-neutral-500 mb-1'
  const sectionCls = 'rounded-xl border border-neutral-200 bg-white p-6 space-y-5'

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Footer</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure the global site footer layout and content.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {notification && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Colors */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-neutral-900">Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Background', key: 'bg_color' },
            { label: 'Text', key: 'text_color' },
            { label: 'Divider', key: 'divider_color' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(config as any)[key]}
                  onChange={e => set({ [key]: e.target.value } as any)}
                  className="size-9 cursor-pointer rounded border border-neutral-200"
                />
                <input
                  type="text"
                  value={(config as any)[key]}
                  onChange={e => set({ [key]: e.target.value } as any)}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-neutral-900">Tagline</h2>
        <div>
          <label className={labelCls}>Tagline text (shown below logo)</label>
          <textarea
            value={config.tagline}
            onChange={e => set({ tagline: e.target.value })}
            rows={3}
            className={inputCls}
            placeholder="From breaking news to cultural essays, we curate stories…"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Social Icons</h2>
          <button onClick={addSocial} className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900">
            <Plus className="size-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {config.social_links.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <select
                value={s.platform}
                onChange={e => updateSocial(i, { platform: e.target.value })}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white w-36"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <input
                type="url"
                value={s.url}
                onChange={e => updateSocial(i, { url: e.target.value })}
                placeholder="https://..."
                className={`${inputCls} flex-1`}
              />
              <button onClick={() => removeSocial(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {config.social_links.length === 0 && (
            <p className="text-sm text-neutral-400">No social icons yet. Click "Add" to add one.</p>
          )}
        </div>
      </div>

      {/* Nav Columns */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Navigation Columns</h2>
          <button onClick={addColumn} className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900">
            <Plus className="size-4" /> Add column
          </button>
        </div>

        <div className="space-y-6">
          {config.nav_columns.map((col, ci) => (
            <div key={ci} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Column {ci + 1}</span>
                <button onClick={() => removeColumn(ci)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Heading text</label>
                  <input
                    type="text"
                    value={col.title}
                    onChange={e => updateColumn(ci, { title: e.target.value })}
                    className={inputCls}
                    placeholder="Navigation"
                  />
                </div>
                <div>
                  <label className={labelCls}>Heading color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={col.title_color || '#6b7280'}
                      onChange={e => updateColumn(ci, { title_color: e.target.value })}
                      className="size-9 cursor-pointer rounded border border-neutral-200" />
                    <input type="text" value={col.title_color || ''}
                      onChange={e => updateColumn(ci, { title_color: e.target.value })}
                      placeholder="inherit" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Link color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={col.link_color || '#1a1a1a'}
                      onChange={e => updateColumn(ci, { link_color: e.target.value })}
                      className="size-9 cursor-pointer rounded border border-neutral-200" />
                    <input type="text" value={col.link_color || ''}
                      onChange={e => updateColumn(ci, { link_color: e.target.value })}
                      placeholder="inherit" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <label className={labelCls}>
                  Links — use <span className="font-semibold text-neutral-700">Page</span> to pick a site page, or <span className="font-semibold text-neutral-700">Custom</span> for any URL
                </label>
                {col.links.map((link, li) => (
                  <LinkRow
                    key={li}
                    link={link}
                    pages={pages}
                    onChange={patch => updateColumnLink(ci, li, patch)}
                    onRemove={() => removeColumnLink(ci, li)}
                  />
                ))}
                <button
                  onClick={() => addColumnLink(ci)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 mt-1"
                >
                  <Plus className="size-3.5" /> Add link
                </button>
              </div>
            </div>
          ))}

          {config.nav_columns.length === 0 && (
            <p className="text-sm text-neutral-400">No columns yet. Click "Add column" to create one.</p>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-neutral-900">Image Grid (2 × 2)</h2>
        <p className="text-xs text-neutral-500">Four images displayed in a 2×2 grid on the right side of the footer.</p>
        <div className="grid grid-cols-2 gap-4">
          {config.images.map((img, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[4/3] relative rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
                {img.url ? (
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-300">
                    <ImageIcon className="size-8" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              <input type="text" value={img.url} onChange={e => updateImage(i, { url: e.target.value })}
                placeholder="Image URL" className={inputCls} />
              <input type="text" value={img.alt} onChange={e => updateImage(i, { alt: e.target.value })}
                placeholder="Alt text" className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => fileInputRefs.current[i]?.click()} disabled={uploadingIdx === i}
                  className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded px-2.5 py-1.5 bg-white disabled:opacity-50">
                  <Upload className="size-3.5" />
                  {uploadingIdx === i ? 'Uploading…' : 'Upload'}
                </button>
                <button onClick={() => openMediaPicker(i)}
                  className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded px-2.5 py-1.5 bg-white">
                  <ImageIcon className="size-3.5" />
                  Library
                </button>
                {img.url && (
                  <button onClick={() => updateImage(i, { url: '', alt: '' })}
                    className="text-xs text-red-400 hover:text-red-600 border border-neutral-200 rounded px-2.5 py-1.5 bg-white">
                    Remove
                  </button>
                )}
              </div>
              <input ref={el => { fileInputRefs.current[i] = el }} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(i, f) }} />
            </div>
          ))}
        </div>
      </div>

      {/* Copyright + Legal */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-neutral-900">Copyright Bar</h2>
        <div>
          <label className={labelCls}>Copyright text (leave blank for auto)</label>
          <input type="text" value={config.copyright_text}
            onChange={e => set({ copyright_text: e.target.value })}
            placeholder={`© ${new Date().getFullYear()} — The Adopted Son. All rights reserved.`}
            className={inputCls} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Legal links</label>
            <button onClick={addLegal} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
              <Plus className="size-3.5" /> Add link
            </button>
          </div>
          {config.legal_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={link.label} onChange={e => updateLegal(i, { label: e.target.value })}
                placeholder="Terms of Service" className={`${inputCls} w-48`} />
              <input type="text" value={link.url} onChange={e => updateLegal(i, { url: e.target.value })}
                placeholder="/terms" className={`${inputCls} flex-1`} />
              <button onClick={() => removeLegal(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-neutral-900">Visibility</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set({ show_on_devotionals: !config.show_on_devotionals })}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.show_on_devotionals ? 'bg-neutral-900' : 'bg-neutral-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${config.show_on_devotionals ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-800">Show on devotional pages</span>
            <p className="text-xs text-neutral-500">Off by default. The footer always shows on regular site pages.</p>
          </div>
        </label>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[640px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Choose from Media Library</h3>
              <button onClick={() => setShowMediaPicker(null)} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none">×</button>
            </div>
            {mediaItems.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
                {mediaItems.map(item => (
                  <button key={item.id}
                    onClick={() => { updateImage(showMediaPicker, { url: item.url, alt: item.filename || '' }); setShowMediaPicker(null) }}
                    className="relative rounded-lg border-2 border-transparent hover:border-neutral-900 overflow-hidden bg-neutral-100 transition-colors"
                    style={{ paddingBottom: '100%' }}>
                    <img src={item.url} alt={item.filename} className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save (bottom) */}
      <div className="flex justify-end pb-10">
        <button onClick={handleSave} disabled={saving}
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
