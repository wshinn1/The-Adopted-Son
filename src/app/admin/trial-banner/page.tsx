'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface TrialBannerSettings {
  // Text content
  active_message: string
  expired_message: string
  success_message: string
  button_text: string
  expired_button_label: string
  placeholder_text: string
  
  // Colors - active state
  active_bg_color: string
  active_text_color: string
  active_button_bg: string
  active_button_text: string
  
  // Colors - expired state
  expired_bg_color: string
  expired_text_color: string
  expired_button_bg: string
  expired_button_text: string
}

const defaultSettings: TrialBannerSettings = {
  active_message: 'You have free access for {days} — enter your email to stay updated.',
  expired_message: 'Your free trial has ended. Subscribe to continue reading premium content.',
  success_message: "You're in! Enjoy your free trial of all devotionals.",
  button_text: 'Notify me',
  expired_button_label: 'View Plans',
  placeholder_text: 'your@email.com',
  
  active_bg_color: '#2B4A6F', // Twilight Blue
  active_text_color: '#ffffff',
  active_button_bg: '#ffffff',
  active_button_text: '#2B4A6F',
  
  expired_bg_color: '#B8704D', // Warm Terracotta
  expired_text_color: '#ffffff',
  expired_button_bg: '#ffffff',
  expired_button_text: '#B8704D',
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
  { name: 'White', hex: '#ffffff' },
]

export default function TrialBannerPage() {
  const [settings, setSettings] = useState<TrialBannerSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'trial_banner_settings')
        .single()

      if (!error && data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'trial_banner_settings', value: JSON.stringify(settings) }, { onConflict: 'key' })

      if (error) throw error
      alert('Trial banner settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const ColorField = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (val: string) => void
  }) => (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-neutral-300 dark:border-neutral-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-mono"
        />
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {brandColors.slice(0, 6).map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            className="w-5 h-5 rounded border border-neutral-300 dark:border-neutral-600 hover:scale-110 transition-transform"
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Trial Banner</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Customize the free trial banner shown to visitors
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Text Content */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Banner Text
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Active Trial Message
              </label>
              <input
                type="text"
                value={settings.active_message}
                onChange={(e) => setSettings({ ...settings, active_message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Use {'{days}'} to show the remaining trial days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Expired Trial Message
              </label>
              <input
                type="text"
                value={settings.expired_message}
                onChange={(e) => setSettings({ ...settings, expired_message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Success Message (after email submit)
              </label>
              <input
                type="text"
                value={settings.success_message}
                onChange={(e) => setSettings({ ...settings, success_message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={settings.button_text}
                  onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Expired Button Text
                </label>
                <input
                  type="text"
                  value={settings.expired_button_label}
                  onChange={(e) => setSettings({ ...settings, expired_button_label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Placeholder
                </label>
                <input
                  type="text"
                  value={settings.placeholder_text}
                  onChange={(e) => setSettings({ ...settings, placeholder_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active State Colors */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Active Trial Colors
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Colors when the user has an active trial period
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ColorField
              label="Background"
              value={settings.active_bg_color}
              onChange={(val) => setSettings({ ...settings, active_bg_color: val })}
            />
            <ColorField
              label="Text"
              value={settings.active_text_color}
              onChange={(val) => setSettings({ ...settings, active_text_color: val })}
            />
            <ColorField
              label="Button Background"
              value={settings.active_button_bg}
              onChange={(val) => setSettings({ ...settings, active_button_bg: val })}
            />
            <ColorField
              label="Button Text"
              value={settings.active_button_text}
              onChange={(val) => setSettings({ ...settings, active_button_text: val })}
            />
          </div>

          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <div
              className="px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ backgroundColor: settings.active_bg_color }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: settings.active_text_color }}
              >
                {settings.active_message.replace('{days}', '9 days')}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={settings.placeholder_text}
                  className="text-sm px-3 py-1.5 rounded-lg w-48"
                  disabled
                />
                <button
                  className="text-sm px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    backgroundColor: settings.active_button_bg,
                    color: settings.active_button_text,
                  }}
                >
                  {settings.button_text}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expired State Colors */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Expired Trial Colors
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Colors when the user's trial has expired
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ColorField
              label="Background"
              value={settings.expired_bg_color}
              onChange={(val) => setSettings({ ...settings, expired_bg_color: val })}
            />
            <ColorField
              label="Text"
              value={settings.expired_text_color}
              onChange={(val) => setSettings({ ...settings, expired_text_color: val })}
            />
            <ColorField
              label="Button Background"
              value={settings.expired_button_bg}
              onChange={(val) => setSettings({ ...settings, expired_button_bg: val })}
            />
            <ColorField
              label="Button Text"
              value={settings.expired_button_text}
              onChange={(val) => setSettings({ ...settings, expired_button_text: val })}
            />
          </div>

          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <div
              className="px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ backgroundColor: settings.expired_bg_color }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: settings.expired_text_color }}
              >
                {settings.expired_message}
              </p>
              <button
                className="text-sm px-4 py-1.5 rounded-lg font-medium"
                style={{
                  backgroundColor: settings.expired_button_bg,
                  color: settings.expired_button_text,
                }}
              >
                {settings.expired_button_label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
