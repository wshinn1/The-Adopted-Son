'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GripVertical, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Share2, Upload, X, Globe, FileText } from 'lucide-react'
import SectionEditor from './SectionEditor'
import Image from 'next/image'

interface SchemaProperty {
  type: string
  title: string
}

interface Schema {
  type: string
  properties: Record<string, SchemaProperty>
}

interface SectionTemplate {
  id: string
  name: string
  description?: string
  component_name: string
  default_data: Record<string, any>
  schema: Schema
  preview_image_url?: string
}

interface PageSection {
  id: string
  template_id: string
  data: Record<string, any>
  sort_order: number
  is_visible: boolean
  section_templates: SectionTemplate | SectionTemplate[]
}

// Helper to normalize section_templates (Supabase returns array from joins)
function getTemplate(section: PageSection): SectionTemplate {
  return Array.isArray(section.section_templates) 
    ? section.section_templates[0] 
    : section.section_templates
}

interface Page {
  id: string
  title: string
  slug: string
  meta_description: string | null
  is_published: boolean
  is_homepage: boolean
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
}

interface PageEditorProps {
  page: Page
  sections: PageSection[]
  templates: SectionTemplate[]
}

export default function PageEditor({ page, sections: initialSections, templates }: PageEditorProps) {
  const router = useRouter()
  const [sections, setSections] = useState<PageSection[]>(initialSections)
  const [pageData, setPageData] = useState(page)
  const [saving, setSaving] = useState(false)
  const [addingSection, setAddingSection] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [ogImageUploading, setOgImageUploading] = useState(false)
  const ogImageInputRef = useRef<HTMLInputElement>(null)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOgImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.url) {
        setPageData({ ...pageData, og_image_url: json.url })
      } else {
        showNotification('Upload failed', 'error')
      }
    } catch {
      showNotification('Upload failed', 'error')
    } finally {
      setOgImageUploading(false)
    }
  }

  const togglePublish = async () => {
    const newStatus = !pageData.is_published
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: newStatus })
        .eq('id', page.id)
      if (error) throw error
      setPageData({ ...pageData, is_published: newStatus })
      router.refresh()
      showNotification(newStatus ? 'Page published successfully!' : 'Page saved as draft.')
    } catch {
      showNotification('Error updating publish status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const savePageSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          title: pageData.title,
          slug: pageData.slug,
          meta_description: pageData.meta_description,
          is_published: pageData.is_published,
          is_homepage: pageData.is_homepage,
          og_title: pageData.og_title || null,
          og_description: pageData.og_description || null,
          og_image_url: pageData.og_image_url || null,
        })
        .eq('id', page.id)

      if (error) throw error
      router.refresh()
      showNotification('Page settings saved successfully!')
    } catch (err) {
      console.error('Error saving page:', err)
      showNotification('Error saving page settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addSection = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setSaving(true)
    try {
      const newSortOrder = sections.length > 0 
        ? Math.max(...sections.map(s => s.sort_order)) + 1 
        : 0

      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          page_id: page.id,
          template_id: templateId,
          data: template.default_data,
          sort_order: newSortOrder,
          is_visible: true,
        })
        .select(`
          id,
          template_id,
          data,
          sort_order,
          is_visible,
          section_templates (
            id,
            name,
            component_name,
            default_data,
            schema
          )
        `)
        .single()

      if (error) throw error
      
      setSections([...sections, data as PageSection])
      setAddingSection(false)
      setExpandedSection(data.id)
    } catch (err) {
      console.error('Error adding section:', err)
      alert('Error adding section')
    } finally {
      setSaving(false)
    }
  }

  const updateSectionData = async (sectionId: string, newData: Record<string, any>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ data: newData })
        .eq('id', sectionId)

      if (error) throw error

      setSections(sections.map(s => 
        s.id === sectionId ? { ...s, data: newData } : s
      ))
      showNotification('Section saved successfully!')
    } catch (err) {
      console.error('Error updating section:', err)
      showNotification('Error updating section', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSectionVisibility = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('page_sections')
        .update({ is_visible: !section.is_visible })
        .eq('id', sectionId)

      if (error) throw error

      setSections(sections.map(s => 
        s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s
      ))
    } catch (err) {
      console.error('Error toggling visibility:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error

      setSections(sections.filter(s => s.id !== sectionId))
    } catch (err) {
      console.error('Error deleting section:', err)
      alert('Error deleting section')
    } finally {
      setSaving(false)
    }
  }

  const moveSectionUp = async (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index <= 0) return

    const newSections = [...sections]
    const temp = newSections[index - 1].sort_order
    newSections[index - 1].sort_order = newSections[index].sort_order
    newSections[index].sort_order = temp

    // Swap positions
    ;[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]]

    setSections(newSections)

    // Update in database
    await supabase.from('page_sections').update({ sort_order: newSections[index].sort_order }).eq('id', newSections[index].id)
    await supabase.from('page_sections').update({ sort_order: newSections[index - 1].sort_order }).eq('id', newSections[index - 1].id)
  }

  const moveSectionDown = async (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index >= sections.length - 1) return

    const newSections = [...sections]
    const temp = newSections[index + 1].sort_order
    newSections[index + 1].sort_order = newSections[index].sort_order
    newSections[index].sort_order = temp

    // Swap positions
    ;[newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]]

    setSections(newSections)

    // Update in database
    await supabase.from('page_sections').update({ sort_order: newSections[index].sort_order }).eq('id', newSections[index].id)
    await supabase.from('page_sections').update({ sort_order: newSections[index + 1].sort_order }).eq('id', newSections[index + 1].id)
  }

  return (
    <div className="max-w-4xl">
      {/* Success/Error Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Edit Page: {page.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pageData.is_published ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
              {pageData.is_published ? <Globe className="size-3" /> : <FileText className="size-3" />}
              {pageData.is_published ? 'Published' : 'Draft'}
            </span>
            <a
              href={page.is_homepage ? '/' : `/${page.slug}`}
              target="_blank"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View page →
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pageData.is_published ? (
            <button
              onClick={togglePublish}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              <FileText className="size-4" />
              Revert to Draft
            </button>
          ) : (
            <button
              onClick={togglePublish}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Globe className="size-4" />
              Publish Page
            </button>
          )}
        </div>
      </div>

      {/* Page Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Page Settings</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={pageData.title}
              onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={pageData.slug}
              onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Meta Description
          </label>
          <textarea
            value={pageData.meta_description || ''}
            onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={pageData.is_homepage}
              onChange={(e) => setPageData({ ...pageData, is_homepage: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Set as Homepage</span>
          </label>
        </div>

        <button
          onClick={savePageSettings}
          disabled={saving}
          className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Social Sharing */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="size-4 text-neutral-500" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Social Sharing</h2>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Customize how this page appears when shared on social media (Facebook, X, iMessage, etc). If left empty, the page title and default site image will be used.
        </p>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Social Title
            </label>
            <input
              type="text"
              value={pageData.og_title || ''}
              onChange={(e) => setPageData({ ...pageData, og_title: e.target.value })}
              placeholder={pageData.title}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Social Description
            </label>
            <textarea
              value={pageData.og_description || ''}
              onChange={(e) => setPageData({ ...pageData, og_description: e.target.value })}
              rows={3}
              placeholder={pageData.meta_description || 'Enter a short description for social sharing...'}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1">{(pageData.og_description || '').length}/200 characters recommended</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Social Image <span className="text-neutral-400 font-normal">(recommended: 1200×630px)</span>
            </label>

            {pageData.og_image_url ? (
              <div className="relative w-full max-w-md">
                <div className="relative aspect-[1200/630] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100">
                  <Image
                    src={pageData.og_image_url}
                    alt="Social sharing image"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  onClick={() => setPageData({ ...pageData, og_image_url: null })}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-neutral-900 rounded-full shadow border border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:text-red-500 transition-colors"
                >
                  <X className="size-4" />
                </button>
                <button
                  onClick={() => ogImageInputRef.current?.click()}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Replace image
                </button>
              </div>
            ) : (
              <button
                onClick={() => ogImageInputRef.current?.click()}
                disabled={ogImageUploading}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                <Upload className="size-4" />
                {ogImageUploading ? 'Uploading...' : 'Upload social image'}
              </button>
            )}

            <input
              ref={ogImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleOgImageUpload}
            />
          </div>
        </div>

        {/* Preview card */}
        {(pageData.og_title || pageData.og_description || pageData.og_image_url) && (
          <div className="mt-5 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden max-w-md">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-3 pt-3 pb-1">Preview</p>
            {pageData.og_image_url && (
              <div className="relative aspect-[1200/630] bg-neutral-100">
                <Image src={pageData.og_image_url} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800">
              <p className="text-xs text-neutral-400 uppercase">theadoptedson.com</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mt-0.5 line-clamp-1">
                {pageData.og_title || pageData.title}
              </p>
              {(pageData.og_description || pageData.meta_description) && (
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                  {pageData.og_description || pageData.meta_description}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={savePageSettings}
          disabled={saving}
          className="mt-5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Social Settings'}
        </button>
      </div>

      {/* Sections */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Page Sections</h2>
          <button
            onClick={() => setAddingSection(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
          >
            <Plus className="size-4" />
            Add Section
          </button>
        </div>

        {/* Add Section Modal */}
        {addingSection && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Choose a section template:
            </h3>
            {templates.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                  No section templates found.
                </p>
                <p className="text-sm text-neutral-500">
                  Go to <a href="/admin/site-settings" className="text-primary-600 underline">Site Settings</a> and click "Initialize Section Templates" first.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => addSection(template.id)}
                    className="text-left px-4 py-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-500 transition-colors"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-sm text-neutral-500 mt-1">
                        {template.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setAddingSection(false)}
              className="mt-3 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Section List */}
        {sections.length === 0 ? (
          <p className="text-neutral-500 text-sm py-8 text-center">
            No sections yet. Add your first section above.
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`border rounded-xl overflow-hidden ${
                  section.is_visible 
                    ? 'border-neutral-200 dark:border-neutral-700' 
                    : 'border-neutral-100 dark:border-neutral-800 opacity-60'
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
                  <GripVertical className="size-4 text-neutral-400" />
                  
                  <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                    {getTemplate(section).name}
                  </span>

                  {/* Reorder buttons */}
                  <button
                    onClick={() => moveSectionUp(section.id)}
                    disabled={index === 0}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => moveSectionDown(section.id)}
                    disabled={index === sections.length - 1}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleSectionVisibility(section.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-600"
                  >
                    {section.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedSection === section.id ? 'Collapse' : 'Edit'}
                  </button>
                </div>

                {/* Section Editor */}
                {expandedSection === section.id && (
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                    <SectionEditor
                      data={section.data}
                      schema={getTemplate(section).schema}
                      defaultData={getTemplate(section).default_data}
                      onSave={(newData) => updateSectionData(section.id, newData)}
                      saving={saving}
                      templateName={getTemplate(section).name}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
