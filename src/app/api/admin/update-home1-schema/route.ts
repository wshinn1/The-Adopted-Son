import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
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

    return NextResponse.json({ success: true, message: 'Home1 template updated with stroke settings' })
  } catch (error) {
    console.error('Error updating Home1 schema:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
