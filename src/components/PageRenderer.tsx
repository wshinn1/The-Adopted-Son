'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

const Home1 = dynamic(() => import('@/components/sections/Home1'))
const TextSection = dynamic(() => import('@/components/sections/TextSection'))
const BlogGallery1 = dynamic(() => import('@/components/sections/BlogGallery1'))
const NewsletterSignUp = dynamic(() => import('@/components/sections/NewsletterSignUp'))

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
