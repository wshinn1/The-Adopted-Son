'use client'

import { getSectionComponent } from '@/components/sections'

interface PageSection {
  id: string
  template_id: string
  data: Record<string, any>
  sort_order: number
  is_visible: boolean
  section_templates: {
    component_name: string
    default_data: Record<string, any>
  }
}

interface PageRendererProps {
  sections: PageSection[]
}

export default function PageRenderer({ sections }: PageRendererProps) {
  // Sort sections by sort_order
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      {sortedSections.map((section) => {
        if (!section.is_visible) return null

        const Component = getSectionComponent(section.section_templates.component_name)
        
        if (!Component) {
          console.warn(`Section component "${section.section_templates.component_name}" not found`)
          return null
        }

        // Merge default data with section-specific data
        const mergedData = {
          ...section.section_templates.default_data,
          ...section.data,
        }

        return <Component key={section.id} data={mergedData} />
      })}
    </>
  )
}
