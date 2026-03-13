import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface SiteSettings {
  site_name: string
  site_tagline: string
  logo_type: 'text' | 'image'
  logo_url: string
  nav_links: Array<{ label: string; url: string }>
  footer_text: string
  social_links: Array<{ platform: string; url: string }>
  typography: {
    heading_font: string
    body_font: string
  }
}

const defaults: SiteSettings = {
  site_name: 'The Adopted Son',
  site_tagline: 'Daily Devotionals',
  logo_type: 'text',
  logo_url: '',
  nav_links: [
    { label: 'Home', url: '/' },
    { label: 'Devotionals', url: '/devotionals' },
    { label: 'About', url: '/about' },
    { label: 'Pricing', url: '/pricing' },
  ],
  footer_text: '© 2026 The Adopted Son. All rights reserved.',
  social_links: [],
  typography: {
    heading_font: 'font-sans',
    body_font: 'font-serif',
  },
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')

  if (error || !data) {
    console.error('Error fetching site settings:', error)
    return defaults
  }

  const settings: Record<string, any> = {}
  
  for (const row of data) {
    try {
      settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
    } catch {
      settings[row.key] = row.value
    }
  }

  return {
    site_name: settings.site_name || defaults.site_name,
    site_tagline: settings.site_tagline || defaults.site_tagline,
    logo_type: settings.logo_type || defaults.logo_type,
    logo_url: settings.logo_url || defaults.logo_url,
    nav_links: settings.nav_links || defaults.nav_links,
    footer_text: settings.footer_text || defaults.footer_text,
    social_links: settings.social_links || defaults.social_links,
    typography: settings.typography || defaults.typography,
  }
}

export async function getPageWithSections(slug: string) {
  const supabase = await createClient()

  // Get page
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (pageError || !page) {
    return null
  }

  // Get page sections with their templates
  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select(`
      id,
      template_id,
      data,
      sort_order,
      is_visible,
      section_templates (
        component_name,
        default_data
      )
    `)
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching page sections:', sectionsError)
    return { page, sections: [] }
  }

  return { page, sections: sections || [] }
}

export async function getHomepage() {
  const supabase = await createClient()

  // Get homepage
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('is_homepage', true)
    .eq('is_published', true)
    .single()

  if (pageError || !page) {
    // Fallback to slug 'home'
    return getPageWithSections('home')
  }

  // Get page sections with their templates
  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select(`
      id,
      template_id,
      data,
      sort_order,
      is_visible,
      section_templates (
        component_name,
        default_data
      )
    `)
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching page sections:', sectionsError)
    return { page, sections: [] }
  }

  return { page, sections: sections || [] }
}
