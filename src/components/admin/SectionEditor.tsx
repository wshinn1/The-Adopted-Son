'use client'

import { useState, useEffect } from 'react'
import { Upload, Plus, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false })

// Color palette swatches matching the site colors admin page
const colorSwatches = [
  '#FFB84D', // Honey Gold
  '#4A3828', // Espresso
  '#2B4A6F', // Twilight Blue
  '#8B4513', // Saddle Brown
  '#4A5D23', // Olive
  '#E8A547', // Amber
  '#7C6D9C', // Dusty Purple
  '#E8DFD5', // Warm Cream
  '#1a1a1a', // Near Black
]

// ColorField component matching the site colors admin styling
function ColorField({ 
  label, 
  value, 
  onChange 
}: { 
  label: string
  value: string
  onChange: (value: string) => void 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-12 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          style={{ backgroundColor: value || '#000000' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {colorSwatches.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded transition-transform hover:scale-110 ${
              value?.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-1 ring-primary-500' : ''
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

interface SchemaProperty {
  type: string
  title: string
  enum?: string[] // For select dropdowns
  format?: string // 'richtext' for rich text editor
  minimum?: number
  maximum?: number
  step?: number
}

interface Schema {
  type: string
  properties: Record<string, SchemaProperty>
}

interface SectionEditorProps {
  data: Record<string, any>
  schema: Schema
  defaultData: Record<string, any>
  onSave: (data: Record<string, any>) => void
  saving: boolean
  templateName?: string
}

// Additional fields for Home1 that may not be in the database schema yet
const HOME1_STROKE_FIELDS: Record<string, SchemaProperty> = {
  card_stroke_enabled: { type: 'boolean', title: 'Card Border Enabled' },
  card_stroke_width: { type: 'number', title: 'Card Border Width', minimum: 0, maximum: 10, step: 0.1 },
  card_stroke_color: { type: 'string', title: 'Card Border Color' },
}

const HOME1_STROKE_DEFAULTS = {
  card_stroke_enabled: false,
  card_stroke_width: 1,
  card_stroke_color: '#E5E5E5',
}

// Additional fields for NewsletterSignUp button colors
const NEWSLETTER_BUTTON_FIELDS: Record<string, SchemaProperty> = {
  button_bg_color: { type: 'string', title: 'Button Background Color' },
  button_text_color: { type: 'string', title: 'Button Text Color' },
  button_hover_bg_color: { type: 'string', title: 'Button Hover Background' },
  button_hover_text_color: { type: 'string', title: 'Button Hover Text Color' },
}

const NEWSLETTER_BUTTON_DEFAULTS = {
  button_bg_color: '#2B4A6F',
  button_text_color: '#ffffff',
  button_hover_bg_color: '#1e3a5f',
  button_hover_text_color: '#ffffff',
}

// HeroSlider1 specific fields - these are handled separately with custom UI
const HEROSLIDER1_CUSTOM_KEYS = ['headlines', 'text_color', 'min_height', 'background_images', 'image_transition_seconds', 'arrow_color', 'arrow_hover_color']

export default function SectionEditor({ 
  data, 
  schema, 
  defaultData, 
  onSave,
  saving,
  templateName 
}: SectionEditorProps) {
  // Merge additional fields for specific sections
  let enhancedSchema = schema
  let enhancedDefaults = defaultData
  
  if (templateName === 'Home1') {
    enhancedSchema = { ...schema, properties: { ...schema?.properties, ...HOME1_STROKE_FIELDS } }
    enhancedDefaults = { ...defaultData, ...HOME1_STROKE_DEFAULTS }
  } else if (templateName === 'NewsletterSignUp') {
    enhancedSchema = { ...schema, properties: { ...schema?.properties, ...NEWSLETTER_BUTTON_FIELDS } }
    enhancedDefaults = { ...defaultData, ...NEWSLETTER_BUTTON_DEFAULTS }
  }

  const [formData, setFormData] = useState<Record<string, any>>({ ...enhancedDefaults, ...data })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setFormData({ ...enhancedDefaults, ...data })
  }, [data, defaultData, templateName])

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', file)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formDataObj,
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      handleChange(key, result.url)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    onSave(formData)
  }

  // Use enhanced schema for Home1 sections to include stroke fields
  const properties = enhancedSchema?.properties || {}
  
  // Separate newsletter button color fields from other properties for special rendering
  const newsletterButtonColorKeys = ['button_bg_color', 'button_text_color', 'button_hover_bg_color', 'button_hover_text_color']
  const isNewsletterSection = templateName === 'NewsletterSignUp'
  const isHeroSlider1Section = templateName === 'HeroSlider1'
  
  let regularProperties = Object.entries(properties)
  if (isNewsletterSection) {
    regularProperties = regularProperties.filter(([key]) => !newsletterButtonColorKeys.includes(key))
  }
  if (isHeroSlider1Section) {
    regularProperties = regularProperties.filter(([key]) => !HEROSLIDER1_CUSTOM_KEYS.includes(key))
  }

  return (
    <div className="space-y-4">
      {regularProperties.map(([key, prop]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {prop.title || key}
          </label>
          
          {/* Rich text editor for content fields */}
          {(prop.format === 'richtext' || key === 'content') ? (
            <RichTextEditor
              content={formData[key] || ''}
              onChange={(value) => handleChange(key, value)}
              placeholder={`Enter ${prop.title || key}...`}
            />
          ) : prop.enum && prop.enum.length > 0 ? (
            /* Select dropdown for enum fields */
            <select
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            >
              {prop.enum.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          ) : /* Image field */
          key.toLowerCase().includes('image') || key.toLowerCase().includes('url') && key !== 'button_url' ? (
            <div className="space-y-2">
              {formData[key] && (
                <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-neutral-100">
                  <img 
                    src={formData[key]} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="Image URL"
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
                      if (file) handleImageUpload(key, file)
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          ) : key.toLowerCase().includes('description') || key.toLowerCase().includes('text') ? (
            /* Textarea for long text */
            <textarea
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          ) : prop.type === 'boolean' || key.toLowerCase().includes('enabled') ? (
            /* Boolean toggle */
            <button
              type="button"
              onClick={() => handleChange(key, !formData[key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData[key] ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : key.toLowerCase().includes('width') && prop.type === 'number' ? (
            /* Number input with step for stroke width */
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formData[key] || 0}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                min={prop.minimum ?? 0}
                max={prop.maximum ?? 10}
                step={prop.step ?? 0.1}
                className="w-24 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
              <span className="text-sm text-neutral-500">px</span>
            </div>
          ) : key.toLowerCase().includes('color') ? (
            /* Color picker */
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData[key] || '#000000'}
                onChange={(e) => handleChange(key, e.target.value)}
                className="h-10 w-16 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="#F5F5F0"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
            </div>
          ) : (
            /* Default text input */
            <input
              type="text"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          )}
        </div>
      ))}

      {/* HeroSlider1 Custom Fields */}
      {isHeroSlider1Section && (
        <div className="space-y-6">
          {/* Headlines - Multiple Fields */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Headlines (rotates daily at 12:30 AM EST)
            </label>
            <p className="text-xs text-neutral-500 mb-3">
              Add multiple headlines. One headline displays per day, rotating through the list.
            </p>
            <div className="space-y-2">
              {(formData.headlines || ['']).map((headline: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => {
                      const newHeadlines = [...(formData.headlines || [''])]
                      newHeadlines[index] = e.target.value
                      handleChange('headlines', newHeadlines)
                    }}
                    placeholder={`Headline ${index + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                  />
                  {(formData.headlines || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newHeadlines = (formData.headlines || []).filter((_: string, i: number) => i !== index)
                        handleChange('headlines', newHeadlines)
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(formData.headlines || []).length < 20 && (
              <button
                type="button"
                onClick={() => {
                  const newHeadlines = [...(formData.headlines || ['']), '']
                  handleChange('headlines', newHeadlines)
                }}
                className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Plus className="size-4" />
                Add Headline ({(formData.headlines || []).length}/20)
              </button>
            )}
          </div>

          {/* Text Color with ColorField */}
          <ColorField
            label="Text Color"
            value={formData.text_color || '#ffffff'}
            onChange={(val) => handleChange('text_color', val)}
          />

          {/* Height with Unit Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Minimum Height
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={parseInt(formData.min_height) || 100}
                onChange={(e) => {
                  const unit = formData.min_height?.includes('px') ? 'px' : formData.min_height?.includes('%') ? '%' : 'vh'
                  handleChange('min_height', `${e.target.value}${unit}`)
                }}
                min={0}
                className="w-24 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              />
              <select
                value={formData.min_height?.includes('px') ? 'px' : formData.min_height?.includes('%') ? '%' : 'vh'}
                onChange={(e) => {
                  const value = parseInt(formData.min_height) || 100
                  handleChange('min_height', `${value}${e.target.value}`)
                }}
                className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              >
                <option value="px">Pixels (px)</option>
                <option value="%">Percent (%)</option>
                <option value="vh">Viewport Height (vh)</option>
              </select>
            </div>
          </div>

          {/* Background Images */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Background Images (up to 5 - will crossfade)
            </label>
            <div className="space-y-3">
              {(formData.background_images || []).map((imgUrl: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  {imgUrl && (
                    <img src={imgUrl} alt={`Background ${index + 1}`} className="w-20 h-14 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const newImages = [...(formData.background_images || [])]
                        newImages[index] = e.target.value
                        handleChange('background_images', newImages)
                      }}
                      placeholder="Image URL"
                      className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                      <Upload className="size-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setUploading(true)
                            try {
                              const formDataObj = new FormData()
                              formDataObj.append('file', file)
                              const response = await fetch('/api/media/upload', { method: 'POST', body: formDataObj })
                              if (!response.ok) throw new Error('Upload failed')
                              const result = await response.json()
                              const newImages = [...(formData.background_images || [])]
                              newImages[index] = result.url
                              handleChange('background_images', newImages)
                            } catch (err) {
                              console.error('Upload error:', err)
                              alert('Error uploading image')
                            } finally {
                              setUploading(false)
                            }
                          }
                        }}
                        disabled={uploading}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = (formData.background_images || []).filter((_: string, i: number) => i !== index)
                        handleChange('background_images', newImages)
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(formData.background_images || []).length < 5 && (
              <button
                type="button"
                onClick={() => {
                  const newImages = [...(formData.background_images || []), '']
                  handleChange('background_images', newImages)
                }}
                className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Plus className="size-4" />
                Add Image ({(formData.background_images || []).length}/5)
              </button>
            )}
          </div>

          {/* Image Transition Seconds */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Image Transition (seconds)
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              How long each background image displays before fading to the next.
            </p>
            <input
              type="number"
              value={formData.image_transition_seconds || 8}
              onChange={(e) => handleChange('image_transition_seconds', Number(e.target.value))}
              min={1}
              max={60}
              className="w-24 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
            />
            <span className="ml-2 text-sm text-neutral-500">seconds</span>
          </div>

          {/* Arrow Colors */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              Scroll Arrow
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <ColorField
                label="Arrow Color"
                value={formData.arrow_color || '#ffffff'}
                onChange={(val) => handleChange('arrow_color', val)}
              />
              <ColorField
                label="Arrow Hover Color"
                value={formData.arrow_hover_color || '#FFB84D'}
                onChange={(val) => handleChange('arrow_hover_color', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Button Colors Section */}
      {isNewsletterSection && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Button Colors
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Customize the subscribe button appearance.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <ColorField
              label="Button Background"
              value={formData.button_bg_color || '#2B4A6F'}
              onChange={(val) => handleChange('button_bg_color', val)}
            />
            <ColorField
              label="Button Text"
              value={formData.button_text_color || '#ffffff'}
              onChange={(val) => handleChange('button_text_color', val)}
            />
            <ColorField
              label="Button Hover Background"
              value={formData.button_hover_bg_color || '#1e3a5f'}
              onChange={(val) => handleChange('button_hover_bg_color', val)}
            />
            <ColorField
              label="Button Hover Text"
              value={formData.button_hover_text_color || '#ffffff'}
              onChange={(val) => handleChange('button_hover_text_color', val)}
            />
          </div>
          {/* Preview */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 mb-3">Preview (hover to see effect):</p>
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: formData.button_bg_color || '#2B4A6F',
                color: formData.button_text_color || '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = formData.button_hover_bg_color || '#1e3a5f'
                e.currentTarget.style.color = formData.button_hover_text_color || '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = formData.button_bg_color || '#2B4A6F'
                e.currentTarget.style.color = formData.button_text_color || '#ffffff'
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Section'}
        </button>
      </div>
    </div>
  )
}
