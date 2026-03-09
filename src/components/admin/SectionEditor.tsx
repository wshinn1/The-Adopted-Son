'use client'

import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'

interface SchemaProperty {
  type: string
  title: string
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
}

export default function SectionEditor({ 
  data, 
  schema, 
  defaultData, 
  onSave,
  saving 
}: SectionEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({ ...defaultData, ...data })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setFormData({ ...defaultData, ...data })
  }, [data, defaultData])

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

  const properties = schema?.properties || {}

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, prop]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {prop.title || key}
          </label>
          
          {/* Image field */}
          {key.toLowerCase().includes('image') || key.toLowerCase().includes('url') && key !== 'button_url' ? (
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
