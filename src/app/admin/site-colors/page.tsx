'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface SiteColors {
  // Primary button colors
  button_primary: string
  button_primary_hover: string
  button_primary_text: string
  
  // Category badge colors
  category_badge_bg: string
  category_badge_text: string
  
  // Link/title hover colors
  title_hover_color: string
  
  // Pagination colors
  pagination_active_bg: string
  pagination_active_text: string
  
  // Newsletter section colors
  newsletter_button_bg: string
  newsletter_button_text: string
}

const defaultColors: SiteColors = {
  button_primary: '#2B4A6F', // Twilight Blue
  button_primary_hover: '#1e3a5f',
  button_primary_text: '#ffffff',
  category_badge_bg: '#4A3828', // Deep Earth
  category_badge_text: '#ffffff',
  title_hover_color: '#E8A547', // Golden Dawn
  pagination_active_bg: '#2B4A6F', // Twilight Blue
  pagination_active_text: '#ffffff',
  newsletter_button_bg: '#2B4A6F', // Twilight Blue
  newsletter_button_text: '#ffffff',
}

// Brand color presets
const brandColors = [
  { name: 'Golden Dawn', hex: '#E8A547' },
  { name: 'Deep Earth', hex: '#4A3828' },
  { name: 'Twilight Blue', hex: '#2B4A6F' },
  { name: 'Warm Terracotta', hex: '#B8704D' },
  { name: 'Sage Shadow', hex: '#5C6B4A' },
  { name: 'Radiant Flame', hex: '#FFB84D' },
  { name: 'Lavender Dusk', hex: '#7B6B9E' },
  { name: 'Warm Cream', hex: '#F5EFE7' },
  { name: 'Charcoal Stone', hex: '#2C2520' },
]

export default function SiteColorsPage() {
  const [colors, setColors] = useState<SiteColors>(defaultColors)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadColors()
  }, [])

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_colors')
        .single()

      if (!error && data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        setColors({ ...defaultColors, ...parsed })
      }
    } catch (err) {
      console.error('Error loading colors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'site_colors', value: JSON.stringify(colors) }, { onConflict: 'key' })

      if (error) throw error
      alert('Colors saved! Refresh the site to see changes.')
    } catch (err) {
      console.error('Error saving colors:', err)
      alert('Error saving colors')
    } finally {
      setSaving(false)
    }
  }

  const ColorField = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string
    description?: string
    value: string
    onChange: (val: string) => void
  }) => (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-neutral-500 mb-2">{description}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-neutral-300 dark:border-neutral-600"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-mono"
          />
        </div>
        {/* Brand color quick picks */}
        <div className="flex flex-wrap gap-1 mt-2">
          {brandColors.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange(c.hex)}
              className="w-6 h-6 rounded border border-neutral-300 dark:border-neutral-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Site Colors</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Customize accent colors throughout your site
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Colors'}
        </button>
      </div>

      {/* Brand Color Reference */}
      <div className="mb-8 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          Your Brand Colors
        </h3>
        <div className="flex flex-wrap gap-3">
          {brandColors.map((c) => (
            <div key={c.hex} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-600"
                style={{ backgroundColor: c.hex }}
              />
              <div>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{c.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {/* Primary Buttons */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Primary Buttons
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Used for Subscribe buttons, Read More buttons, and other primary actions
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Button Background"
              value={colors.button_primary}
              onChange={(val) => setColors({ ...colors, button_primary: val })}
            />
            <ColorField
              label="Button Hover"
              value={colors.button_primary_hover}
              onChange={(val) => setColors({ ...colors, button_primary_hover: val })}
            />
            <ColorField
              label="Button Text"
              value={colors.button_primary_text}
              onChange={(val) => setColors({ ...colors, button_primary_text: val })}
            />
          </div>
          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <button
              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: colors.button_primary,
                color: colors.button_primary_text,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.button_primary_hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.button_primary)}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Category Badges */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Category Badges
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Used for category/tag labels on devotional cards (e.g., IDENTITY, TRUST, ORPHAN)
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Badge Background"
              value={colors.category_badge_bg}
              onChange={(val) => setColors({ ...colors, category_badge_bg: val })}
            />
            <ColorField
              label="Badge Text"
              value={colors.category_badge_text}
              onChange={(val) => setColors({ ...colors, category_badge_text: val })}
            />
          </div>
          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: colors.category_badge_bg,
                  color: colors.category_badge_text,
                }}
              >
                Identity
              </span>
              <span
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: colors.category_badge_bg,
                  color: colors.category_badge_text,
                }}
              >
                Trust
              </span>
              <span
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: colors.category_badge_bg,
                  color: colors.category_badge_text,
                }}
              >
                Spiritual Warfare
              </span>
            </div>
          </div>
        </div>

        {/* Title Hover */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Title Hover Color
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            The color used when hovering over devotional titles and links
          </p>
          <ColorField
            label="Hover Color"
            value={colors.title_hover_color}
            onChange={(val) => setColors({ ...colors, title_hover_color: val })}
          />
          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview (hover to see):</p>
            <h3
              className="text-xl font-bold cursor-pointer transition-colors"
              style={{ color: '#1a1a1a' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.title_hover_color)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a1a')}
            >
              Spiritual Warfare, the Battle of the Flesh
            </h3>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Pagination
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Colors for active page numbers in pagination
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Active Page Background"
              value={colors.pagination_active_bg}
              onChange={(val) => setColors({ ...colors, pagination_active_bg: val })}
            />
            <ColorField
              label="Active Page Text"
              value={colors.pagination_active_text}
              onChange={(val) => setColors({ ...colors, pagination_active_text: val })}
            />
          </div>
          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <div className="flex items-center gap-1">
              <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-700">
                1
              </span>
              <span
                className="w-10 h-10 flex items-center justify-center rounded-lg font-medium"
                style={{
                  backgroundColor: colors.pagination_active_bg,
                  color: colors.pagination_active_text,
                }}
              >
                2
              </span>
              <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-700">
                3
              </span>
            </div>
          </div>
        </div>

        {/* Newsletter Button */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Newsletter Section
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Colors for the subscribe button in newsletter signup sections
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Button Background"
              value={colors.newsletter_button_bg}
              onChange={(val) => setColors({ ...colors, newsletter_button_bg: val })}
            />
            <ColorField
              label="Button Text"
              value={colors.newsletter_button_text}
              onChange={(val) => setColors({ ...colors, newsletter_button_text: val })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
