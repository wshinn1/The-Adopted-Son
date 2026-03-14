import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const defaultSettings = {
  enabled: false,
  delay_seconds: 7,
  reshow_days: 4,
  heading: 'Stay Connected',
  subheading: 'Subscribe to receive daily devotionals and spiritual encouragement.',
  button_text: 'Subscribe',
  background_color: '#FFFFFF',
  text_color: '#1a1a1a',
  accent_color: '#8B5A2B',
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'popup_settings')
      .single()

    if (error || !data) {
      return NextResponse.json(defaultSettings)
    }

    const settings = typeof data.value === 'string' 
      ? JSON.parse(data.value) 
      : data.value

    return NextResponse.json({ ...defaultSettings, ...settings })
  } catch (error) {
    console.error('Error fetching popup settings:', error)
    return NextResponse.json(defaultSettings)
  }
}
