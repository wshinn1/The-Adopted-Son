'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { X } from 'lucide-react'

interface PopupSettings {
  enabled: boolean
  delay_seconds: number
  reshow_days: number
  heading: string
  subheading: string
  button_text: string
  background_color: string
  text_color: string
  accent_color: string
}

const defaultSettings: PopupSettings = {
  enabled: false,
  delay_seconds: 7,
  reshow_days: 4,
  heading: 'Stay Connected',
  subheading: 'Subscribe to receive daily devotionals and spiritual encouragement.',
  button_text: 'Subscribe',
  background_color: '#FFFFFF',
  text_color: '#1a1a1a',
  accent_color: '#8B5A2B',
}

export default function PopupSettingsPage() {
  const [settings, setSettings] = useState<PopupSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'popup_settings')
        .single()

      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (err) {
      console.error('Error loading popup settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'popup_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) throw error
      setMessage('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving popup settings:', err)
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
          <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Newsletter Popup</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure the popup that appears for first-time visitors</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Enable Popup</h3>
                <p className="text-sm text-neutral-500 mt-0.5">Show popup to first-time visitors</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Timing Settings */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Timing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Delay before showing (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.delay_seconds}
                  onChange={(e) => setSettings({ ...settings, delay_seconds: parseInt(e.target.value) || 7 })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Days before showing again
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.reshow_days}
                  onChange={(e) => setSettings({ ...settings, reshow_days: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Heading</label>
                <input
                  type="text"
                  value={settings.heading}
                  onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Subheading</label>
                <textarea
                  value={settings.subheading}
                  onChange={(e) => setSettings({ ...settings, subheading: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Button Text</label>
                <input
                  type="text"
                  value={settings.button_text}
                  onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={settings.background_color}
                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.text_color}
                    onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={settings.text_color}
                    onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Accent Color (Button)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accent_color}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={settings.accent_color}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Live Preview</h3>
            <div className="relative bg-neutral-200 dark:bg-neutral-800 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {/* Simulated backdrop */}
              <div className="absolute inset-0 bg-black/30 rounded-lg" />
              
              {/* Popup Preview */}
              <div
                className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6"
                style={{ backgroundColor: settings.background_color }}
              >
                {/* Close button */}
                <button
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: settings.text_color }}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center pt-2">
                  <h4
                    className="text-xl font-bold mb-2"
                    style={{ color: settings.text_color }}
                  >
                    {settings.heading || 'Stay Connected'}
                  </h4>
                  <p
                    className="text-sm mb-6 opacity-80"
                    style={{ color: settings.text_color }}
                  >
                    {settings.subheading || 'Subscribe to receive updates.'}
                  </p>

                  {/* Email input preview */}
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white"
                    />
                    <button
                      className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: settings.accent_color }}
                    >
                      {settings.button_text || 'Subscribe'}
                    </button>
                  </div>

                  <p className="text-xs mt-4 opacity-50" style={{ color: settings.text_color }}>
                    No spam. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-neutral-500 mt-3 text-center">
              This is how the popup will appear to visitors
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
