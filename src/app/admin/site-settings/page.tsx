'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Upload, Plus, Trash2 } from 'lucide-react'

interface NavLink {
  label: string
  url: string
}

interface SocialLink {
  platform: string
  url: string
}

interface Page {
  id: string
  title: string
  slug: string
}

const FONT_OPTIONS = [
  { value: 'font-sans', label: 'Sans-serif (Geist)' },
  { value: 'font-serif', label: 'Serif (Georgia)' },
  { value: 'font-mono', label: 'Monospace (Geist Mono)' },
]

export default function SiteSettingsPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [siteName, setSiteName] = useState('')
  const [siteTagline, setSiteTagline] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [navLinks, setNavLinks] = useState<NavLink[]>([])
  const [footerText, setFooterText] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [headingFont, setHeadingFont] = useState('font-sans')
  const [bodyFont, setBodyFont] = useState('font-serif')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug')
        .order('title')

      if (error) throw error
      setPages(data || [])
    } catch (err) {
      console.error('Error loading pages:', err)
    }
  }

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')

      if (error) throw error

      const settings: Record<string, any> = {}
      for (const row of data || []) {
        try {
          settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
        } catch {
          settings[row.key] = row.value
        }
      }

      setSiteName(settings.site_name || 'The Adopted Son')
      setSiteTagline(settings.site_tagline || 'Daily Devotionals')
      setLogoUrl(settings.logo_url || '')
      setNavLinks(settings.nav_links || [{ label: 'Home', url: '/' }])
      setFooterText(settings.footer_text || '')
      setSocialLinks(settings.social_links || [])
      setHeadingFont(settings.typography?.heading_font || 'font-sans')
      setBodyFont(settings.typography?.body_font || 'font-serif')
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
    
    if (error) throw error
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSetting('site_name', siteName)
      await saveSetting('site_tagline', siteTagline)
      await saveSetting('logo_url', logoUrl)
      await saveSetting('nav_links', navLinks)
      await saveSetting('footer_text', footerText)
      await saveSetting('social_links', socialLinks)
      await saveSetting('typography', { heading_font: headingFont, body_font: bodyFont })
      alert('Settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      setLogoUrl(result.url)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading logo')
    }
  }

  const addNavLink = () => {
    setNavLinks([...navLinks, { label: '', url: '' }])
  }

  const updateNavLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...navLinks]
    updated[index][field] = value
    setNavLinks(updated)
  }

  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index))
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }])
  }

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinks]
    updated[index][field] = value
    setSocialLinks(updated)
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div className="py-8 text-center text-neutral-500">Loading settings...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        Site Settings
      </h1>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">General</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Logo
              </label>
              {logoUrl && (
                <div className="mb-2">
                  <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo URL"
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <label className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                  <Upload className="size-4" />
                  <span className="text-sm">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Navigation Links</h2>
            <button
              onClick={addNavLink}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="size-4" />
              Add Link
            </button>
          </div>

          <div className="space-y-3">
            {navLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateNavLink(index, 'label', e.target.value)}
                  placeholder="Label"
                  className="w-32 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <select
                  value={link.url}
                  onChange={(e) => {
                    const value = e.target.value
                    updateNavLink(index, 'url', value)
                    // Auto-fill label if empty and a page is selected
                    if (value && !link.label) {
                      const page = pages.find(p => `/${p.slug}` === value || (p.slug === 'home' && value === '/'))
                      if (page) {
                        updateNavLink(index, 'label', page.title)
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                >
                  <option value="">Select a page or enter custom URL</option>
                  <option value="/">Home</option>
                  <option value="/devotionals">Devotionals</option>
                  {pages.filter(p => p.slug !== 'home').map((page) => (
                    <option key={page.id} value={`/${page.slug}`}>
                      {page.title}
                    </option>
                  ))}
                  <option value="__custom__">Custom URL...</option>
                </select>
                {link.url === '__custom__' || (link.url && !['/', '/devotionals'].includes(link.url) && !pages.some(p => `/${p.slug}` === link.url)) ? (
                  <input
                    type="text"
                    value={link.url === '__custom__' ? '' : link.url}
                    onChange={(e) => updateNavLink(index, 'url', e.target.value)}
                    placeholder="/custom-url"
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                  />
                ) : null}
                <button
                  onClick={() => removeNavLink(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Typography</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Heading Font
              </label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Used for blog post titles and headings</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Body Font
              </label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Used for blog post body text and excerpts</p>
            </div>

            {/* Font Preview */}
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-xs text-neutral-500 mb-3">Preview:</p>
              <h3 className={`text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 ${headingFont}`}>
                Sample Heading Text
              </h3>
              <p className={`text-neutral-700 dark:text-neutral-300 ${bodyFont}`}>
                This is how your body text will appear in blog posts. The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Footer</h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Footer Text
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 Your Site. All rights reserved."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Social Links</h2>
            <button
              onClick={addSocialLink}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="size-4" />
              Add Link
            </button>
          </div>

          <div className="space-y-3">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                >
                  <option value="">Platform</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {socialLinks.length === 0 && (
              <p className="text-sm text-neutral-500">No social links added yet.</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
