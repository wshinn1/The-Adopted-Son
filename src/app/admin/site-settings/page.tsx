'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Upload, Plus, Trash2 } from 'lucide-react'
import Head from 'next/head'

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
]

const groupedFonts = FONT_OPTIONS.reduce((acc, font) => {
  if (!acc[font.category]) acc[font.category] = []
  acc[font.category].push(font)
  return acc
}, {} as Record<string, typeof FONT_OPTIONS>)

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

  // Load preview fonts dynamically
  useEffect(() => {
    const GOOGLE_FONT_MAP: Record<string, string> = {
      Inter: 'Inter:wght@400;700',
      Poppins: 'Poppins:wght@400;700',
      Open_Sans: 'Open+Sans:wght@400;700',
      Montserrat: 'Montserrat:wght@400;700',
      Lato: 'Lato:wght@400;700',
      Nunito: 'Nunito:wght@400;700',
      Raleway: 'Raleway:wght@400;700',
      Work_Sans: 'Work+Sans:wght@400;700',
      DM_Sans: 'DM+Sans:wght@400;700',
      Outfit: 'Outfit:wght@400;700',
      Playfair_Display: 'Playfair+Display:wght@400;700',
      Merriweather: 'Merriweather:wght@400;700',
      Lora: 'Lora:wght@400;700',
      Source_Serif_4: 'Source+Serif+4:wght@400;700',
      Crimson_Text: 'Crimson+Text:wght@400;700',
      EB_Garamond: 'EB+Garamond:wght@400;700',
      Libre_Baskerville: 'Libre+Baskerville:wght@400;700',
      Cormorant_Garamond: 'Cormorant+Garamond:wght@400;700',
      Bitter: 'Bitter:wght@400;700',
      Spectral: 'Spectral:wght@400;700',
    }

    const fontsToLoad: string[] = []
    if (GOOGLE_FONT_MAP[headingFont]) fontsToLoad.push(GOOGLE_FONT_MAP[headingFont])
    if (GOOGLE_FONT_MAP[bodyFont] && bodyFont !== headingFont) fontsToLoad.push(GOOGLE_FONT_MAP[bodyFont])

    if (fontsToLoad.length > 0) {
      const linkId = 'admin-preview-fonts'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}`).join('&')}&display=swap`
    }
  }, [headingFont, bodyFont])

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
                {Object.entries(groupedFonts).map(([category, fonts]) => (
                  <optgroup key={category} label={category}>
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </optgroup>
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
                {Object.entries(groupedFonts).map(([category, fonts]) => (
                  <optgroup key={category} label={category}>
                    {fonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Used for blog post body text and excerpts</p>
            </div>

            {/* Font Preview */}
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-xs text-neutral-500 mb-3">Preview (save to see changes on your site):</p>
              <h3 
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2"
                style={{ fontFamily: `'${headingFont.replace(/_/g, ' ')}', sans-serif` }}
              >
                Sample Heading Text
              </h3>
              <p 
                className="text-neutral-700 dark:text-neutral-300"
                style={{ fontFamily: `'${bodyFont.replace(/_/g, ' ')}', serif` }}
              >
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
