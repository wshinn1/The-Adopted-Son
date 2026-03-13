'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// This MUST be a client component — ssr: false requires 'use client'.
// All section dynamic imports live here, isolated from PageRenderer,
// so a merge can never accidentally drop the 'use client' directive.

const Home1 = dynamic(() => import('@/components/sections/Home1'), { ssr: false })
const TextSection = dynamic(() => import('@/components/sections/TextSection'), { ssr: false })
const BlogGallery1 = dynamic(() => import('@/components/sections/BlogGallery1'), { ssr: false })
const NewsletterSignUp = dynamic(() => import('@/components/sections/NewsletterSignUp'), { ssr: false })

const SECTION_MAP: Record<string, ComponentType<{ data: any }>> = {
  Home1,
  TextSection,
  BlogGallery1,
  NewsletterSignUp,
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

export default function SectionRenderer({ sections }: { sections: PageSection[] }) {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      {sorted.map((section) => {
        if (!section.is_visible) return null

        const template = Array.isArray(section.section_templates)
          ? section.section_templates[0]
          : section.section_templates

        if (!template) return null

        const Component = SECTION_MAP[template.component_name]
        if (!Component) return null

        const mergedData = { ...template.default_data, ...section.data }

        return <Component key={section.id} data={mergedData} />
      })}
    </>
  )
}
