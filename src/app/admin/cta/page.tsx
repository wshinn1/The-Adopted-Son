'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CtaStrip from '@/components/sections/CtaStrip'
import type { CtaStripData } from '@/components/sections/CtaStrip'

const DEFAULTS: CtaStripData & { enabled_on_devotionals: boolean } = {
  headline: 'Support This Ministry',
  subtext: 'Your generosity helps us create daily devotionals and reach more people.',
  button_text: 'Give Today',
  button_url: '/give',
  bg_color: '#1a1a2e',
  text_color: '#ffffff',
  subtext_color: 'rgba(255,255,255,0.6)',
  button_bg_color: '#ffffff',
  button_text_color: '#1a1a2e',
  button_hover_bg_color: '#f0f0f0',
  show_icon: true,
  icon_color: 'rgba(255,255,255,0.7)',
  full_width: false,
  headline_size: '14px',
  subtext_size: '12px',
  enabled_on_devotionals: false,
}

const FONT_SIZE_OPTIONS = [
  { label: 'XS — 12px', value: '12px' },
  { label: 'SM — 14px', value: '14px' },
  { label: 'Base — 16px', value: '16px' },
  { label: 'LG — 18px', value: '18px' },
  { label: 'XL — 20px', value: '20px' },
  { label: '2XL — 24px', value: '24px' },
  { label: '3XL — 30px', value: '30px' },
  { label: '4XL — 36px', value: '36px' },
]

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-neutral-300 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-neutral-300 rounded px-2 py-1.5 text-sm font-mono"
          placeholder="#ffffff"
        />
      </div>
    </div>
  )
}

export default function CtaAdminPage() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cta_settings')
        .single()

      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        setSettings({ ...DEFAULTS, ...parsed })
      }
      setLoading(false)
    }
    load()
  }, [])

  function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('site_settings')
      .upsert({ key: 'cta_settings', value: JSON.stringify(settings) }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="p-8 text-neutral-500 text-sm">Loading…</div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">CTA Block</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Edit the global call-to-action strip. You can also insert it as a section on any page.
        </p>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Preview
        </div>
        <div className="p-4 bg-white">
          <CtaStrip data={settings} />
        </div>
      </div>

      {/* Content */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Content</h2>

        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Headline</label>
            <input
              type="text"
              value={settings.headline}
              onChange={(e) => update('headline', e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Font size</label>
            <select
              value={settings.headline_size}
              onChange={(e) => update('headline_size', e.target.value)}
              className="border border-neutral-300 rounded px-2 py-2 text-sm"
            >
              {FONT_SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Subtext</label>
            <input
              type="text"
              value={settings.subtext}
              onChange={(e) => update('subtext', e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Font size</label>
            <select
              value={settings.subtext_size}
              onChange={(e) => update('subtext_size', e.target.value)}
              className="border border-neutral-300 rounded px-2 py-2 text-sm"
            >
              {FONT_SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Button Text</label>
            <input
              type="text"
              value={settings.button_text}
              onChange={(e) => update('button_text', e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Button URL</label>
            <input
              type="text"
              value={settings.button_url}
              onChange={(e) => update('button_url', e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="show_icon"
            type="checkbox"
            checked={settings.show_icon}
            onChange={(e) => update('show_icon', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600"
          />
          <label htmlFor="show_icon" className="text-sm text-neutral-700">Show sparkle icon</label>
        </div>
      </section>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Colors</h2>

        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Background" value={settings.bg_color} onChange={(v) => update('bg_color', v)} />
          <ColorField label="Headline color" value={settings.text_color} onChange={(v) => update('text_color', v)} />
          <ColorField label="Subtext color" value={settings.subtext_color} onChange={(v) => update('subtext_color', v)} />
          <ColorField label="Icon color" value={settings.icon_color} onChange={(v) => update('icon_color', v)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Button background" value={settings.button_bg_color} onChange={(v) => update('button_bg_color', v)} />
          <ColorField label="Button text" value={settings.button_text_color} onChange={(v) => update('button_text_color', v)} />
          <ColorField label="Button hover bg" value={settings.button_hover_bg_color} onChange={(v) => update('button_hover_bg_color', v)} />
        </div>
      </section>

      {/* Devotionals */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Devotionals</h2>
        <div className="rounded-lg border border-neutral-200 p-4 space-y-1">
          <div className="flex items-center gap-3">
            <input
              id="enabled_on_devotionals"
              type="checkbox"
              checked={settings.enabled_on_devotionals}
              onChange={(e) => update('enabled_on_devotionals', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-blue-600"
            />
            <div>
              <label htmlFor="enabled_on_devotionals" className="text-sm font-medium text-neutral-700">
                Show on devotionals
              </label>
              <p className="text-xs text-neutral-500">
                Automatically inserts this CTA strip at the top and bottom of every devotional.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved ✓</span>
        )}
      </div>
    </div>
  )
}
