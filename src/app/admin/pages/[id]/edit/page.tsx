import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import PageEditor from '@/components/admin/PageEditor'

export const metadata: Metadata = { title: 'Edit Page — Admin' }

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get page data
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !page) {
    notFound()
  }

  // Get page sections with templates
  const { data: sections } = await supabase
    .from('page_sections')
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
    .eq('page_id', id)
    .order('sort_order', { ascending: true })

  // Get all available templates
  const { data: templates, error: templatesError } = await supabase
    .from('section_templates')
    .select('*')
    .order('name', { ascending: true })

  return (
    <PageEditor
      page={page}
      sections={sections || []}
      templates={templates || []}
    />
  )
}
