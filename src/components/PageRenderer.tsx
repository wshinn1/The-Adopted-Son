// static imports — no dynamic() to avoid Turbopack workspace root misdetection
import type { ComponentType } from 'react'
import Home1 from '@/components/sections/Home1'
import TextSection from '@/components/sections/TextSection'
import BlogGallery1 from '@/components/sections/BlogGallery1'
import NewsletterSignUp from '@/components/sections/NewsletterSignUp'
import ContactForm1 from '@/components/sections/ContactForm1'

const SECTION_MAP: Record<string, ComponentType<{ data: any }>> = {
  Home1,
  TextSection,
  BlogGallery1,
  NewsletterSignUp,
  ContactForm1,
}

interface PageSection {
  id: string
  template_id: string
  data: Record<string, any>
  sort_order: number
  is_visible: boolean
  section_templates:
    | { component_name: string; default_data: Record<string, any> }
    | { component_name: string; default_data: Record<string, any> }[]
}

interface PageRendererProps {
  sections: PageSection[]
}

export default function PageRenderer({ sections }: PageRendererProps) {
  const visible = sections
    .filter((s) => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      {visible.map((section) => {
        const template = Array.isArray(section.section_templates)
          ? section.section_templates[0]
          : section.section_templates
        const componentName = template?.component_name
        const Component = componentName ? SECTION_MAP[componentName] : null
        if (!Component) return null
        const mergedData = { ...(template?.default_data ?? {}), ...section.data }
        return <Component key={section.id} data={mergedData} />
      })}
    </>
  )
}
