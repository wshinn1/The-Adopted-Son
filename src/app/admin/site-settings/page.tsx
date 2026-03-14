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
  const [headingFont, setHeadingFont] = useState('font-sans')
  const [bodyFont, setBodyFont] = useState('font-serif')
  const [showNewsletterOnPosts, setShowNewsletterOnPosts] = useState(true)
  const [shareButtons, setShareButtons] = useState({
    enabled: true,
    facebook: true,
    twitter: true,
    linkedin: false,
    email: true,
  })
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
      setHeadingFont(settings.typography?.heading_font || 'font-sans')
      setBodyFont(settings.typography?.body_font || 'font-serif')
      setShowNewsletterOnPosts(settings.show_newsletter_on_posts !== false)
      if (settings.newsletter_settings) {
        setNewsletterSettings(settings.newsletter_settings)
      }
      if (settings.share_buttons) {
        setShareButtons(settings.share_buttons)
      }
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
      await saveSetting('typography', { heading_font: headingFont, body_font: bodyFont })
      await saveSetting('show_newsletter_on_posts', showNewsletterOnPosts)
      await saveSetting('newsletter_settings', newsletterSettings)
      await saveSetting('share_buttons', shareButtons)
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

        {/* Blog Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Blog Settings</h2>
          
          <div className="space-y-6">
            {/* Newsletter toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Newsletter Signup on Posts
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Show email subscribe form at the end of blog posts and devotionals
                </p>
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

            {/* Newsletter Styling */}
            {showNewsletterOnPosts && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Newsletter Appearance</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newsletterSettings.background_color}
                        onChange={(e) => setNewsletterSettings({ ...newsletterSettings, background_color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
                      />
                      <input
                        type="text"
                        value={newsletterSettings.background_color}
                        onChange={(e) => setNewsletterSettings({ ...newsletterSettings, background_color: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newsletterSettings.text_color}
                        onChange={(e) => setNewsletterSettings({ ...newsletterSettings, text_color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
                      />
                      <input
                        type="text"
                        value={newsletterSettings.text_color}
                        onChange={(e) => setNewsletterSettings({ ...newsletterSettings, text_color: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Heading</label>
                  <input
                    type="text"
                    value={newsletterSettings.heading}
                    onChange={(e) => setNewsletterSettings({ ...newsletterSettings, heading: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Subheading</label>
                  <input
                    type="text"
                    value={newsletterSettings.subheading}
                    onChange={(e) => setNewsletterSettings({ ...newsletterSettings, subheading: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={newsletterSettings.button_text}
                    onChange={(e) => setNewsletterSettings({ ...newsletterSettings, button_text: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>
            )}

            {/* Share buttons section */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Share Buttons
                  </label>
                  <p className="text-xs text-neutral-500 mt-1">
                    Show social share buttons on blog posts and devotionals
                  </p>
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
                <div className="ml-4 space-y-3">
                  {[
                    { key: 'facebook', label: 'Facebook', color: '#1877F2' },
                    { key: 'twitter', label: 'Twitter / X', color: '#1DA1F2' },
                    { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
                    { key: 'email', label: 'Email', color: '#6B7280' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShareButtons({ ...shareButtons, [key]: !shareButtons[key as keyof typeof shareButtons] })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          shareButtons[key as keyof typeof shareButtons] ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            shareButtons[key as keyof typeof shareButtons] ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
