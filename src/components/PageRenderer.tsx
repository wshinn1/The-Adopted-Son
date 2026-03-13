import SectionRenderer from '@/components/SectionRenderer'

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

// PageRenderer is a Server Component — it passes serializable section data
// down to SectionRenderer which is a Client Component with dynamic imports.
export default function PageRenderer({ sections }: PageRendererProps) {
  return <SectionRenderer sections={sections} />
}
