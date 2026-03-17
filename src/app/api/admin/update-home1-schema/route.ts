import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Allow GET for easy browser trigger
export async function GET() {
  return updateHome1Schema()
}

export async function POST() {
  return updateHome1Schema()
}

async function updateHome1Schema() {
  try {
    // First, get the current Home1 template
    const { data: template, error: fetchError } = await supabaseAdmin
      .from('section_templates')
      .select('*')
      .eq('name', 'Home1')
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch template', details: fetchError }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: 'Home1 template not found' }, { status: 404 })
    }

    // Parse existing schema and default_data
    const schema = typeof template.schema === 'string' ? JSON.parse(template.schema) : template.schema
    const defaultData = typeof template.default_data === 'string' ? JSON.parse(template.default_data) : template.default_data

    // Add stroke properties to schema
    schema.properties = schema.properties || {}
    schema.properties.card_stroke_enabled = {
      type: 'boolean',
      title: 'Card Border Enabled'
    }
    schema.properties.card_stroke_width = {
      type: 'number',
      title: 'Card Border Width (px)',
      minimum: 0,
      maximum: 10,
      step: 0.1
    }
    schema.properties.card_stroke_color = {
      type: 'string',
      title: 'Card Border Color'
    }

    // Add stroke defaults to default_data
    defaultData.card_stroke_enabled = false
    defaultData.card_stroke_width = 1
    defaultData.card_stroke_color = '#E5E5E5'

    // Update the template
    const { error: updateError } = await supabaseAdmin
      .from('section_templates')
      .update({
        schema: schema,
        default_data: defaultData
      })
      .eq('name', 'Home1')

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update template', details: updateError }, { status: 500 })
    }

    // Also update existing page_sections that use Home1 to include stroke fields
    const { data: existingSections } = await supabaseAdmin
      .from('page_sections')
      .select('id, data')
      .eq('template_name', 'Home1')

    if (existingSections && existingSections.length > 0) {
      for (const section of existingSections) {
        const sectionData = typeof section.data === 'string' ? JSON.parse(section.data) : section.data
        // Only add if not already present
        if (sectionData.card_stroke_enabled === undefined) {
          sectionData.card_stroke_enabled = false
          sectionData.card_stroke_width = 1
          sectionData.card_stroke_color = '#E5E5E5'
          
          await supabaseAdmin
            .from('page_sections')
            .update({ data: sectionData })
            .eq('id', section.id)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Home1 template updated with stroke settings',
      sectionsUpdated: existingSections?.length || 0
    })
  } catch (error) {
    console.error('Error updating Home1 schema:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
