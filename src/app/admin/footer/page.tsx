'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FooterConfig, FooterNavLink, FooterNavColumn, FooterSocialLink, FooterImage } from '@/components/BigFooter'

const BUILT_IN_ROUTES = [
  { label: 'Home', url: '/' },
  { label: 'Devotionals', url: '/devotionals' },
  { label: 'About', url: '/about' },
  { label: 'Give', url: '/give' },
  { label: 'Contact', url: '/contact' },
  { label: 'Authors', url: '/authors' },
  { label: 'Categories', url: '/categories' },
  { label: 'Tags', url: '/tags' },
]

const SOCIAL_PLATFORMS = ['Twitter', 'Instagram', 'Facebook', 'Youtube', 'LinkedIn']

type SitePage = { id: string; title: string; slug: string }

function LinkRow({
  link,
  pages,
  onChange,
  onRemove,
}: {
  link: FooterNavLink
  pages: SitePage[]
  onChange: (l: FooterNavLink) => void
  onRemove: () => void
}) {
  const [mode, setMode] = useState<'page' | 'custom'>('custom')

  return (
    <div className="flex gap-2 items-center mb-2">
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMode('page')}
          className={`px-2 py-1 rounded text-xs ${mode === 'page' ? 'bg-neutral-700 text-white' : 'bg-neutral-100 text-neutral-500'}`}
        >Page</button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-2 py-1 rounded text-xs ${mode === 'custom' ? 'bg-neutral-700 text-white' : 'bg-neutral-100 text-neutral-500'}`}
        >Custom</button>
      </div>

      {mode === 'page' ? (
        <select
          className="border rounded px-2 py-1 text-sm flex-1 bg-white"
          value={link.url}
          onChange={e => {
            const url = e.target.value
            const builtIn = BUILT_IN_ROUTES.find(r => r.url === url)
            const page = pages.find(p => `/${p.slug}` === url)
            const label = builtIn?.label ?? page?.title ?? url
            onChange({ ...link, url, label: link.label || label })
          }}
        >
          <option value="">— pick a page —</option>
          <optgroup label="Site Pages">
            {pages.map(p => (
              <option key={p.id} value={`/${p.slug}`}>{p.title}</option>
            ))}
          </optgroup>
          <optgroup label="Built-in Routes">
            {BUILT_IN_ROUTES.map(r => (
              <option key={r.url} value={r.url}>{r.label}</option>
            ))}
          </optgroup>
        </select>
      ) : (
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          placeholder="URL"
          value={link.url}
          onChange={e => onChange({ ...link, url: e.target.value })}
        />
      )}

      <input
        className="border rounded px-2 py-1 text-sm w-32"
        placeholder="Label"
        value={link.label}
        onChange={e => onChange({ ...link, label: e.target.value })}
      />
      <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
    </div>
  )
}

const defaultConfig: FooterConfig = {
  bg_color: '#1a1a1a',
  text_color: '#ffffff',
  tagline: '',
  social_links: [],
  nav_columns: [],
  images: [],
  copyright_text: '',
  legal_links: [],
  show_on_devotionals: false,
  divider_color: 'rgba(255,255,255,0.1)',
}

export default function FooterAdminPage() {
  const [config, setConfig] = useState<FooterConfig>(defaultConfig)
  const [pages, setPages] = useState<SitePage[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaPickTarget, setMediaPickTarget] = useState<null | { type: 'image'; index: number } | { type: 'logo' }>(null)
  const [mediaImages, setMediaImages] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: settingRow }, { data: pageRows }] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'footer_config').single(),
        supabase.from('pages').select('id, title, slug').eq('is_published', true).order('title'),
      ])

      if (settingRow?.value) {
        try {
          const val = typeof settingRow.value === 'string' ? JSON.parse(settingRow.value) : settingRow.value
          setConfig({ ...defaultConfig, ...val })
        } catch {}
      }

      if (pageRows) setPages(pageRows)
    }
    load()
  }, [])

  async function loadMedia() {
    const { data } = await supabase.storage.from('media').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    const urls = (data ?? []).filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)).map(f => {
      const { data: pub } = supabase.storage.from('media').getPublicUrl(f.name)
      return pub.publicUrl
    })
    setMediaImages(urls)
  }

  function openMedia(target: typeof mediaPickTarget) {
    setMediaPickTarget(target)
    setMediaOpen(true)
    loadMedia()
  }

  function pickMedia(url: string) {
    if (!mediaPickTarget) return
    if (mediaPickTarget.type === 'image') {
      const imgs = [...(config.images ?? [])]
      imgs[mediaPickTarget.index] = { ...imgs[mediaPickTarget.index], url }
      setConfig(c => ({ ...c, images: imgs }))
    }
    setMediaOpen(false)
    setMediaPickTarget(null)
  }

  async function save() {
    setSaving(true)
    await supabase.from('site_settings').upsert({ key: 'footer_config', value: JSON.stringify(config) }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setField = <K extends keyof FooterConfig>(key: K, val: FooterConfig[K]) =>
    setConfig(c => ({ ...c, [key]: val }))

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Footer Settings</h1>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* Appearance */}
      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1 block">Background Color</span>
            <div className="flex gap-2 items-center">
              <input type="color" value={config.bg_color ?? '#1a1a1a'} onChange={e => setField('bg_color', e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
              <input type="text" value={config.bg_color ?? '#1a1a1a'} onChange={e => setField('bg_color', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1 block">Text Color</span>
            <div className="flex gap-2 items-center">
              <input type="color" value={config.text_color ?? '#ffffff'} onChange={e => setField('text_color', e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
              <input type="text" value={config.text_color ?? '#ffffff'} onChange={e => setField('text_color', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1 block">Divider Color</span>
            <input type="text" value={config.divider_color ?? 'rgba(255,255,255,0.1)'} onChange={e => setField('divider_color', e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          </label>
        </div>
      </section>

      {/* Logo & Tagline */}
      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-lg font-semibold">Logo & Tagline</h2>
        <label className="block">
          <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1 block">Tagline</span>
          <input
            type="text"
            value={config.tagline ?? ''}
            onChange={e => setField('tagline', e.target.value)}
            placeholder="Brief description shown below the logo"
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </label>
      </section>

      {/* Social Links */}
      <section className="space-y-4 border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <button
            type="button"
            onClick={() => setField('social_links', [...(config.social_links ?? []), { platform: 'Instagram', url: '' }])}
            className="text-sm text-blue-600 hover:underline"
          >+ Add</button>
        </div>
        {(config.social_links ?? []).map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1 text-sm w-32"
              value={s.platform}
              onChange={e => {
                const links = [...(config.social_links ?? [])]
                links[i] = { ...links[i], platform: e.target.value }
                setField('social_links', links)
              }}
            >
              {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              className="border rounded px-2 py-1 text-sm flex-1"
              placeholder="https://..."
              value={s.url}
              onChange={e => {
                const links = [...(config.social_links ?? [])]
                links[i] = { ...links[i], url: e.target.value }
                setField('social_links', links)
              }}
            />
            <button
              type="button"
              onClick={() => setField('social_links', (config.social_links ?? []).filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-600 text-lg leading-none"
            >×</button>
          </div>
        ))}
      </section>

      {/* Nav Columns */}
      <section className="space-y-4 border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Navigation Columns</h2>
          <button
            type="button"
            onClick={() => setField('nav_columns', [...(config.nav_columns ?? []), { heading: '', links: [] }])}
            className="text-sm text-blue-600 hover:underline"
          >+ Add Column</button>
        </div>
        {(config.nav_columns ?? []).map((col, ci) => (
          <div key={ci} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-2 items-center">
              <input
                className="border rounded px-2 py-1 text-sm flex-1 font-semibold"
                placeholder="Column heading"
                value={col.heading}
                onChange={e => {
                  const cols = [...(config.nav_columns ?? [])]
                  cols[ci] = { ...cols[ci], heading: e.target.value }
                  setField('nav_columns', cols)
                }}
              />
              <button
                type="button"
                onClick={() => setField('nav_columns', (config.nav_columns ?? []).filter((_, j) => j !== ci))}
                className="text-red-400 hover:text-red-600 text-sm"
              >Remove Column</button>
            </div>
            {col.links.map((link, li) => (
              <LinkRow
                key={li}
                link={link}
                pages={pages}
                onChange={updated => {
                  const cols = [...(config.nav_columns ?? [])]
                  const links = [...cols[ci].links]
                  links[li] = updated
                  cols[ci] = { ...cols[ci], links }
                  setField('nav_columns', cols)
                }}
                onRemove={() => {
                  const cols = [...(config.nav_columns ?? [])]
                  cols[ci] = { ...cols[ci], links: cols[ci].links.filter((_, j) => j !== li) }
                  setField('nav_columns', cols)
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                const cols = [...(config.nav_columns ?? [])]
                cols[ci] = { ...cols[ci], links: [...cols[ci].links, { label: '', url: '' }] }
                setField('nav_columns', cols)
              }}
              className="text-xs text-blue-600 hover:underline"
            >+ Add Link</button>
          </div>
        ))}
      </section>

      {/* Image Grid */}
      <section className="space-y-4 border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Image Grid (up to 4)</h2>
          {(config.images ?? []).length < 4 && (
            <button
              type="button"
              onClick={() => setField('images', [...(config.images ?? []), { url: '', alt: '', link: '' }])}
              className="text-sm text-blue-600 hover:underline"
            >+ Add Image</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(config.images ?? []).map((img, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="relative w-full pb-[100%] bg-neutral-100 rounded overflow-hidden">
                {img.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => openMedia({ type: 'image', index: i })}
                className="w-full text-xs py-1 border rounded bg-neutral-50 hover:bg-neutral-100"
              >
                {img.url ? 'Change Image' : 'Pick Image'}
              </button>
              <input
                className="border rounded px-2 py-1 text-xs w-full"
                placeholder="Alt text"
                value={img.alt ?? ''}
                onChange={e => {
                  const imgs = [...(config.images ?? [])]
                  imgs[i] = { ...imgs[i], alt: e.target.value }
                  setField('images', imgs)
                }}
              />
              <input
                className="border rounded px-2 py-1 text-xs w-full"
                placeholder="Link (optional)"
                value={img.link ?? ''}
                onChange={e => {
                  const imgs = [...(config.images ?? [])]
                  imgs[i] = { ...imgs[i], link: e.target.value }
                  setField('images', imgs)
                }}
              />
              <button
                type="button"
                onClick={() => setField('images', (config.images ?? []).filter((_, j) => j !== i))}
                className="text-xs text-red-400 hover:text-red-600"
              >Remove</button>
            </div>
          ))}
        </div>
      </section>

      {/* Copyright */}
      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-lg font-semibold">Copyright Bar</h2>
        <label className="block">
          <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1 block">Copyright Text</span>
          <input
            type="text"
            value={config.copyright_text ?? ''}
            onChange={e => setField('copyright_text', e.target.value)}
            placeholder={`© ${new Date().getFullYear()} Site Name. All rights reserved.`}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </label>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Legal Links</span>
            <button
              type="button"
              onClick={() => setField('legal_links', [...(config.legal_links ?? []), { label: '', url: '' }])}
              className="text-sm text-blue-600 hover:underline"
            >+ Add</button>
          </div>
          {(config.legal_links ?? []).map((link, i) => (
            <LinkRow
              key={i}
              link={link}
              pages={pages}
              onChange={updated => {
                const links = [...(config.legal_links ?? [])]
                links[i] = updated
                setField('legal_links', links)
              }}
              onRemove={() => setField('legal_links', (config.legal_links ?? []).filter((_, j) => j !== i))}
            />
          ))}
        </div>
      </section>

      {/* Visibility */}
      <section className="space-y-4 border rounded-xl p-6">
        <h2 className="text-lg font-semibold">Visibility</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.show_on_devotionals ?? false}
            onChange={e => setField('show_on_devotionals', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show footer on individual devotional posts</span>
        </label>
      </section>

      {/* Media Picker Modal */}
      {mediaOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setMediaOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Pick Image</h3>
              <button onClick={() => setMediaOpen(false)} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mediaImages.map(url => (
                <button
                  key={url}
                  type="button"
                  onClick={() => pickMedia(url)}
                  className="relative w-full rounded overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500"
                  style={{ paddingBottom: '100%' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              ))}
              {mediaImages.length === 0 && (
                <p className="col-span-3 text-center text-neutral-400 text-sm py-8">No images in media library.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
