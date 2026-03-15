'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BlogSettingsPage() {
  const [showNewsletterOnPosts, setShowNewsletterOnPosts] = useState(true)
  const [newsletterSettings, setNewsletterSettings] = useState({
    headline: 'Stay Connected',
    description: 'Subscribe to receive daily devotionals and spiritual encouragement.',
    button_text: 'Subscribe',
    disclaimer_text: 'No spam, ever. Unsubscribe anytime.',
    accent_color: '#B87333',
  })
  const [shareButtons, setShareButtons] = useState({
    enabled: true,
    facebook: true,
    twitter: true,
    linkedin: false,
    email: true,
  })
  const [notifyNewSubscribers, setNotifyNewSubscribers] = useState(true)
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('weshinn@gmail.com')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')

      if (data) {
        const settings: Record<string, unknown> = {}
        data.forEach((row: { key: string; value: unknown }) => {
          try {
            settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
          } catch {
            settings[row.key] = row.value
          }
        })

        if (typeof settings.show_newsletter_on_posts === 'boolean') {
          setShowNewsletterOnPosts(settings.show_newsletter_on_posts)
        }
        if (settings.newsletter_settings && typeof settings.newsletter_settings === 'object') {
          setNewsletterSettings(prev => ({ ...prev, ...(settings.newsletter_settings as object) }))
        }
        if (settings.share_buttons && typeof settings.share_buttons === 'object') {
          setShareButtons(prev => ({ ...prev, ...(settings.share_buttons as object) }))
        }
        setNotifyNewSubscribers(settings.notify_new_subscribers !== false)
        if (settings.admin_notification_email && typeof settings.admin_notification_email === 'string') {
          setAdminNotificationEmail(settings.admin_notification_email)
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveSetting(key: string, value: unknown) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
    if (error) console.error('Error saving setting:', error)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSetting('show_newsletter_on_posts', showNewsletterOnPosts)
      await saveSetting('newsletter_settings', newsletterSettings)
      await saveSetting('share_buttons', shareButtons)
      await saveSetting('notify_new_subscribers', notifyNewSubscribers)
      await saveSetting('admin_notification_email', adminNotificationEmail)
      alert('Settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Blog Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure newsletter, sharing, and notification settings for your blog posts.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Newsletter Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Newsletter on Posts</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show Newsletter Signup
              </label>
              <p className="text-xs text-neutral-500 mt-1">Display newsletter signup form at the end of blog posts</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewsletterOnPosts(!showNewsletterOnPosts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showNewsletterOnPosts ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showNewsletterOnPosts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {showNewsletterOnPosts && (
            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Newsletter Styling</h3>
              
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={newsletterSettings.headline}
                  onChange={(e) => setNewsletterSettings({ ...newsletterSettings, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Description</label>
                <textarea
                  value={newsletterSettings.description}
                  onChange={(e) => setNewsletterSettings({ ...newsletterSettings, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={newsletterSettings.button_text}
                    onChange={(e) => setNewsletterSettings({ ...newsletterSettings, button_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newsletterSettings.accent_color}
                      onChange={(e) => setNewsletterSettings({ ...newsletterSettings, accent_color: e.target.value })}
                      className="h-9 w-12 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newsletterSettings.accent_color}
                      onChange={(e) => setNewsletterSettings({ ...newsletterSettings, accent_color: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Disclaimer Text</label>
                <input
                  type="text"
                  value={newsletterSettings.disclaimer_text}
                  onChange={(e) => setNewsletterSettings({ ...newsletterSettings, disclaimer_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Email Notifications</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New Subscriber Notifications
              </label>
              <p className="text-xs text-neutral-500 mt-1">
                Receive an email when someone subscribes to your newsletter
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotifyNewSubscribers(!notifyNewSubscribers)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifyNewSubscribers ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifyNewSubscribers ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {notifyNewSubscribers && (
            <div className="ml-4">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Notification Email
              </label>
              <input
                type="email"
                value={adminNotificationEmail}
                onChange={(e) => setAdminNotificationEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Email address where new subscriber notifications will be sent
              </p>
            </div>
          )}
        </div>

        {/* Share Buttons Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Share Buttons</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable Share Buttons
              </label>
              <p className="text-xs text-neutral-500 mt-1">Show social sharing buttons on blog posts</p>
            </div>
            <button
              type="button"
              onClick={() => setShareButtons({ ...shareButtons, enabled: !shareButtons.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareButtons.enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareButtons.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {shareButtons.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              {[
                { key: 'facebook', label: 'Facebook' },
                { key: 'twitter', label: 'Twitter/X' },
                { key: 'linkedin', label: 'LinkedIn' },
                { key: 'email', label: 'Email' },
              ].map((platform) => (
                <label key={platform.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareButtons[platform.key as keyof typeof shareButtons] as boolean}
                    onChange={(e) => setShareButtons({ ...shareButtons, [platform.key]: e.target.checked })}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{platform.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
