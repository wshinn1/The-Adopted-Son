'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

interface PageSection {
  id: string
  template_id: string
  data: Record<string, any>
  sort_order: number
  is_visible: boolean
  section_templates: {
    component_name: string
    default_data: Record<string, any>
  } | {
    component_name: string
    default_data: Record<string, any>
  }[]
}

interface PageRendererProps {
  sections: PageSection[]
}

// Each section is loaded independently so no server-only module
// can bleed across boundaries. ssr:false prevents next/headers usage
// from being traced into the client bundle.
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

export default function PageRenderer({ sections }: PageRendererProps) {
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      {sortedSections.map((section) => {
        if (!section.is_visible) return null

        const template = Array.isArray(section.section_templates)
          ? section.section_templates[0]
          : section.section_templates

        if (!template) return null

        const Component = SECTION_MAP[template.component_name]

        if (!Component) {
          console.warn(`Section component "${template.component_name}" not found`)
          return null
        }

        const mergedData = {
          ...template.default_data,
          ...section.data,
        }

        return <Component key={section.id} data={mergedData} />
      })}
    </>
  )
}
