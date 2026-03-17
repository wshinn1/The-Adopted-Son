'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

interface NewsletterSettings {
  // Text content
  heading: string
  subheading: string
  button_text: string
  success_message: string
  placeholder_name: string
  placeholder_email: string
  
  // Colors
  background_color: string
  text_color: string
  button_bg_color: string
  button_text_color: string
  button_hover_bg_color: string
  button_hover_text_color: string
  input_bg_color: string
  input_text_color: string
  input_border_color: string
  
  // Background image
  background_image_url: string
  background_overlay_opacity: number
}

const defaultSettings: NewsletterSettings = {
  heading: 'Stay Connected',
  subheading: 'Get the latest devotionals and updates delivered to your inbox.',
  button_text: 'Subscribe',
  success_message: 'Thank you for subscribing! Check your inbox for confirmation.',
  placeholder_name: 'First name',
  placeholder_email: 'Email address',
  
  background_color: '#F5F2ED',
  text_color: '#1a1a1a',
  button_bg_color: '#2B4A6F',
  button_text_color: '#ffffff',
  button_hover_bg_color: '#1e3a5f',
  button_hover_text_color: '#ffffff',
  input_bg_color: '#ffffff',
  input_text_color: '#1a1a1a',
  input_border_color: '#e5e5e5',
  
  background_image_url: '',
  background_overlay_opacity: 0,
}

// Color swatches for quick selection
const colorSwatches = [
  '#FFB84D', // Golden Dawn
  '#4A3828', // Rich Brown
  '#2B4A6F', // Twilight Blue
  '#8B4513', // Warm Terracotta
  '#6B8E6B', // Sage Shadow
  '#DAA520', // Deep Gold
  '#7B68EE', // Soft Purple
  '#E5E5E5', // Light Gray
  '#1a1a1a', // Near Black
]

function ColorField({ 
  label, 
  value, 
  onChange 
}: { 
  label: string
  value: string
  onChange: (val: string) => void 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3 mb-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded cursor-pointer border border-neutral-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {colorSwatches.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 transition-all ${
              value.toLowerCase() === color.toLowerCase() 
                ? 'border-primary-600 scale-110' 
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

export default function NewsletterSettingsPage() {
  const [settings, setSettings] = useState<NewsletterSettings>(defaultSettings)
  const [showOnPosts, setShowOnPosts] = useState(true)
  const [showOnDevotionals, setShowOnDevotionals] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['newsletter_settings', 'show_newsletter_on_posts', 'show_newsletter_on_devotionals'])

      if (data) {
        data.forEach((row: { key: string; value: unknown }) => {
          try {
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
            if (row.key === 'newsletter_settings' && typeof parsed === 'object') {
              setSettings(prev => ({ ...prev, ...parsed }))
            } else if (row.key === 'show_newsletter_on_posts') {
              setShowOnPosts(parsed !== false)
            } else if (row.key === 'show_newsletter_on_devotionals') {
              setShowOnDevotionals(parsed !== false)
            }
          } catch {
            // ignore parse errors
          }
        })
      }
    } catch (err) {
      console.error('Error loading newsletter settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Save newsletter settings
      await supabase
        .from('site_settings')
        .upsert({ key: 'newsletter_settings', value: settings }, { onConflict: 'key' })
      
      // Save visibility toggles
      await supabase
        .from('site_settings')
        .upsert({ key: 'show_newsletter_on_posts', value: showOnPosts }, { onConflict: 'key' })
      
      await supabase
        .from('site_settings')
        .upsert({ key: 'show_newsletter_on_devotionals', value: showOnDevotionals }, { onConflict: 'key' })

      alert('Newsletter settings saved!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      setSettings(prev => ({ ...prev, background_image_url: result.url }))
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Global Newsletter Settings
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure the newsletter signup that appears on devotional pages and blog posts.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Visibility Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Display Settings
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Choose where the newsletter signup form should appear.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Show on Devotional Posts
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Display newsletter signup at the end of each devotional
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnPosts(!showOnPosts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnPosts ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnPosts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Show on Devotionals List Page
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Display newsletter signup on the main devotionals page
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnDevotionals(!showOnDevotionals)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnDevotionals ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnDevotionals ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Text Content
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Customize the text displayed in the newsletter signup form.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Heading
              </label>
              <input
                type="text"
                value={settings.heading}
                onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={settings.button_text}
                onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Subheading
              </label>
              <textarea
                value={settings.subheading}
                onChange={(e) => setSettings({ ...settings, subheading: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Success Message
              </label>
              <input
                type="text"
                value={settings.success_message}
                onChange={(e) => setSettings({ ...settings, success_message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Name Field Placeholder
              </label>
              <input
                type="text"
                value={settings.placeholder_name}
                onChange={(e) => setSettings({ ...settings, placeholder_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email Field Placeholder
              </label>
              <input
                type="text"
                value={settings.placeholder_email}
                onChange={(e) => setSettings({ ...settings, placeholder_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Background Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Background
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Set the background color and optional image for the newsletter section.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Background Color"
              value={settings.background_color}
              onChange={(val) => setSettings({ ...settings, background_color: val })}
            />
            
            <ColorField
              label="Text Color"
              value={settings.text_color}
              onChange={(val) => setSettings({ ...settings, text_color: val })}
            />
          </div>
          
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Background Image (optional)
            </label>
            
            {settings.background_image_url && (
              <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-neutral-100 mb-3">
                <img 
                  src={settings.background_image_url} 
                  alt="Background Preview" 
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, background_image_url: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.background_image_url}
                onChange={(e) => setSettings({ ...settings, background_image_url: e.target.value })}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
              <label className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                <Upload className="size-4" />
                <span className="text-sm">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Button Colors */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Button Colors
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Customize the subscribe button appearance.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Button Background"
              value={settings.button_bg_color}
              onChange={(val) => setSettings({ ...settings, button_bg_color: val })}
            />
            <ColorField
              label="Button Text"
              value={settings.button_text_color}
              onChange={(val) => setSettings({ ...settings, button_text_color: val })}
            />
            <ColorField
              label="Button Hover Background"
              value={settings.button_hover_bg_color}
              onChange={(val) => setSettings({ ...settings, button_hover_bg_color: val })}
            />
            <ColorField
              label="Button Hover Text"
              value={settings.button_hover_text_color}
              onChange={(val) => setSettings({ ...settings, button_hover_text_color: val })}
            />
          </div>
          
          {/* Button Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview (hover to see effect):</p>
            <button
              className="px-7 py-3 font-medium text-sm rounded-xl transition-colors"
              style={{
                backgroundColor: settings.button_bg_color,
                color: settings.button_text_color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = settings.button_hover_bg_color
                e.currentTarget.style.color = settings.button_hover_text_color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = settings.button_bg_color
                e.currentTarget.style.color = settings.button_text_color
              }}
            >
              {settings.button_text}
            </button>
          </div>
        </div>

        {/* Input Field Colors */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Input Field Colors
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Customize the appearance of the email and name input fields.
          </p>
          
          <div className="grid gap-6 md:grid-cols-3">
            <ColorField
              label="Input Background"
              value={settings.input_bg_color}
              onChange={(val) => setSettings({ ...settings, input_bg_color: val })}
            />
            <ColorField
              label="Input Text"
              value={settings.input_text_color}
              onChange={(val) => setSettings({ ...settings, input_text_color: val })}
            />
            <ColorField
              label="Input Border"
              value={settings.input_border_color}
              onChange={(val) => setSettings({ ...settings, input_border_color: val })}
            />
          </div>
          
          {/* Input Preview */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview:</p>
            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                placeholder={settings.placeholder_name}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: settings.input_bg_color,
                  color: settings.input_text_color,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: settings.input_border_color,
                }}
              />
              <input
                type="email"
                placeholder={settings.placeholder_email}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: settings.input_bg_color,
                  color: settings.input_text_color,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: settings.input_border_color,
                }}
              />
            </div>
          </div>
        </div>

        {/* Full Preview */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Full Preview
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            See how the newsletter signup will look on your site.
          </p>
          
          <div 
            className="relative rounded-xl overflow-hidden p-8 md:p-12"
            style={{
              backgroundColor: settings.background_color,
              backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="max-w-xl mx-auto text-center">
              <h3 
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: settings.text_color }}
              >
                {settings.heading}
              </h3>
              <p 
                className="text-base mb-6"
                style={{ color: settings.text_color, opacity: 0.75 }}
              >
                {settings.subheading}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder={settings.placeholder_name}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: settings.input_bg_color,
                    color: settings.input_text_color,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: settings.input_border_color,
                  }}
                />
                <input
                  type="email"
                  placeholder={settings.placeholder_email}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: settings.input_bg_color,
                    color: settings.input_text_color,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: settings.input_border_color,
                  }}
                />
                <button
                  className="px-7 py-3 font-medium text-sm rounded-xl whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: settings.button_bg_color,
                    color: settings.button_text_color,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = settings.button_hover_bg_color
                    e.currentTarget.style.color = settings.button_hover_text_color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = settings.button_bg_color
                    e.currentTarget.style.color = settings.button_text_color
                  }}
                >
                  {settings.button_text}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
