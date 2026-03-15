'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Upload, Plus, Trash2 } from 'lucide-react'
import Head from 'next/head'

interface SocialLink {
  platform: string
  url: string
}

const FONT_OPTIONS = [
  // System fonts
  { value: 'Be_Vietnam_Pro', label: 'Be Vietnam Pro (Default)', category: 'System' },
  { value: 'system-ui', label: 'System UI', category: 'System' },
  
  // Sans-serif Google Fonts
  { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
  { value: 'Open_Sans', label: 'Open Sans', category: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
  { value: 'Nunito', label: 'Nunito', category: 'Sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'Sans-serif' },
  { value: 'Work_Sans', label: 'Work Sans', category: 'Sans-serif' },
  { value: 'DM_Sans', label: 'DM Sans', category: 'Sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
  
  // Serif Google Fonts
  { value: 'Playfair_Display', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
  { value: 'Lora', label: 'Lora', category: 'Serif' },
  { value: 'Source_Serif_4', label: 'Source Serif 4', category: 'Serif' },
  { value: 'Crimson_Text', label: 'Crimson Text', category: 'Serif' },
  { value: 'EB_Garamond', label: 'EB Garamond', category: 'Serif' },
  { value: 'Libre_Baskerville', label: 'Libre Baskerville', category: 'Serif' },
  { value: 'Cormorant_Garamond', label: 'Cormorant Garamond', category: 'Serif' },
  { value: 'Bitter', label: 'Bitter', category: 'Serif' },
  { value: 'Spectral', label: 'Spectral', category: 'Serif' },
  
  // Monospace Google Fonts
  { value: 'JetBrains_Mono', label: 'JetBrains Mono', category: 'Monospace' },
  { value: 'Fira_Code', label: 'Fira Code', category: 'Monospace' },
  { value: 'Source_Code_Pro', label: 'Source Code Pro', category: 'Monospace' },
  { value: 'IBM_Plex_Mono', label: 'IBM Plex Mono', category: 'Monospace' },
  { value: 'Space_Mono', label: 'Space Mono', category: 'Monospace' },
  { value: 'Roboto_Mono', label: 'Roboto Mono', category: 'Monospace' },
  { value: 'Courier_Prime', label: 'Courier Prime', category: 'Monospace' },
  { value: 'Anonymous_Pro', label: 'Anonymous Pro', category: 'Monospace' },
]

const FONT_SIZE_OPTIONS = [
  { value: '8', label: '8 pt' },
  { value: '9', label: '9 pt' },
  { value: '10', label: '10 pt' },
  { value: '11', label: '11 pt' },
  { value: '12', label: '12 pt (Default)' },
  { value: '13', label: '13 pt' },
  { value: '14', label: '14 pt' },
  { value: '16', label: '16 pt' },
  { value: '18', label: '18 pt' },
  { value: '20', label: '20 pt' },
  { value: '22', label: '22 pt' },
  { value: '24', label: '24 pt' },
]

const HEADING_SIZE_OPTIONS = [
  { value: '18', label: '18 pt' },
  { value: '20', label: '20 pt' },
  { value: '24', label: '24 pt' },
  { value: '28', label: '28 pt' },
  { value: '32', label: '32 pt (Default)' },
  { value: '36', label: '36 pt' },
  { value: '40', label: '40 pt' },
  { value: '48', label: '48 pt' },
  { value: '56', label: '56 pt' },
  { value: '64', label: '64 pt' },
]

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular (Default)' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
]

const groupedFonts = FONT_OPTIONS.reduce((acc, font) => {
  if (!acc[font.category]) acc[font.category] = []
  acc[font.category].push(font)
  return acc
}, {} as Record<string, typeof FONT_OPTIONS>)

export default function SiteSettingsPage() {
  const [siteName, setSiteName] = useState('')
  const [siteTagline, setSiteTagline] = useState('')
  const [logoType, setLogoType] = useState<'text' | 'image'>('text')
  const [logoUrl, setLogoUrl] = useState('')
  const [footerText, setFooterText] = useState('')
  const [footerLinks, setFooterLinks] = useState<{ label: string; url: string }[]>([])
  const [faviconUrl, setFaviconUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seedingTemplates, setSeedingTemplates] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')

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
      setLogoType(settings.logo_type || 'text')
      setLogoUrl(settings.logo_url || '')
      setFooterText(settings.footer_text || '')
      setFooterLinks(settings.footer_links || [])
      setFaviconUrl(settings.favicon_url || '')
      setSocialLinks(settings.social_links || [])
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
      await saveSetting('logo_type', logoType)
      await saveSetting('logo_url', logoType === 'image' ? logoUrl : '')
      await saveSetting('footer_text', footerText)
      await saveSetting('footer_links', footerLinks)
      await saveSetting('favicon_url', faviconUrl)
      await saveSetting('social_links', socialLinks)
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Header Logo
              </label>
              
              {/* Logo Type Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setLogoType('text')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    logoType === 'text'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  Text Logo
                </button>
                <button
                  type="button"
                  onClick={() => setLogoType('image')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    logoType === 'image'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  Image Logo
                </button>
              </div>

              {logoType === 'text' ? (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Your site name will be displayed as the logo:
                  </p>
                  <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {siteName || 'Site Name'}
                  </p>
                </div>
              ) : (
                <>
                  {logoUrl && (
                    <div className="mb-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-2">Current logo:</p>
                      <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Logo URL (PNG recommended)"
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                      <Upload className="size-4" />
                      <span className="text-sm">Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoUpload(file)
                        }}
                      />
                    </label>
                  </div>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="mt-2 text-sm text-red-500 hover:text-red-600"
                    >
                      Remove logo
                    </button>
                  )}
                </>
              )}
              <p className="text-xs text-neutral-500 mt-2">
                {logoType === 'text' 
                  ? 'The site name above will be used as your header logo.'
                  : 'Upload a PNG or SVG image for best quality. Recommended size: 200x50px.'
                }
              </p>
            </div>
          </div>
        </div>

{/* Favicon */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Favicon</h2>
          <div className="flex items-center gap-4">
            {faviconUrl && (
              <img src={faviconUrl} alt="Favicon" className="size-8 rounded object-contain border border-neutral-200" />
            )}
            <div className="flex-1 flex items-center gap-3">
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="Favicon URL (.ico, .png, .svg)"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
              <label className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                <Upload className="size-4" />
                <span className="text-sm">Upload</span>
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
                    if (res.ok) {
                      const { url } = await res.json()
                      setFaviconUrl(url)
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Recommended: 32×32px .ico or .png file.</p>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Footer</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder={`Copyright © ${new Date().getFullYear()} The Adopted Son`}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Footer Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Footer Links
                </label>
                <button
                  type="button"
                  onClick={() => setFooterLinks([...footerLinks, { label: '', url: '' }])}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="size-4" />
                  Add Link
                </button>
              </div>
              <div className="space-y-2">
                {footerLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const updated = [...footerLinks]
                        updated[i].label = e.target.value
                        setFooterLinks(updated)
                      }}
                      placeholder="Label"
                      className="w-32 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...footerLinks]
                        updated[i].url = e.target.value
                        setFooterLinks(updated)
                      }}
                      placeholder="/page or https://..."
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFooterLinks(footerLinks.filter((_, j) => j !== i))}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {footerLinks.length === 0 && (
                  <p className="text-sm text-neutral-500">No footer links added yet.</p>
                )}
              </div>
            </div>
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

{/* Page Builder Templates */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Page Builder</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Initialize or update the section templates for the page builder. This will create or update available components like Text Section and Hero sections.
          </p>
          <button
            onClick={async () => {
              setSeedingTemplates(true)
              setSeedMessage('')
              try {
                const res = await fetch('/api/admin/seed-templates', { method: 'POST' })
                const data = await res.json()
                if (data.success) {
                  setSeedMessage('Templates seeded successfully!')
                } else if (data.error === 'Tables do not exist') {
                  setSeedMessage('Database tables need to be created. Please run the SQL migration in scripts/004_create_section_tables.sql via Supabase Dashboard.')
                } else {
                  setSeedMessage(data.error || 'Failed to seed templates')
                }
              } catch (err) {
                setSeedMessage('Error seeding templates')
              } finally {
                setSeedingTemplates(false)
              }
            }}
            disabled={seedingTemplates}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50"
          >
            {seedingTemplates ? 'Initializing...' : 'Initialize Section Templates'}
          </button>
          {seedMessage && (
            <p className={`mt-3 text-sm ${seedMessage.includes('successfully') ? 'text-green-600' : 'text-amber-600'}`}>
              {seedMessage}
            </p>
          )}
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
