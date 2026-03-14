'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Map font values to Google Fonts API format
const GOOGLE_FONT_MAP: Record<string, string> = {
  Inter: 'Inter:wght@300;400;500;600;700',
  Poppins: 'Poppins:wght@300;400;500;600;700',
  Open_Sans: 'Open+Sans:wght@300;400;500;600;700',
  Montserrat: 'Montserrat:wght@300;400;500;600;700',
  Lato: 'Lato:wght@300;400;700',
  Nunito: 'Nunito:wght@300;400;500;600;700',
  Raleway: 'Raleway:wght@300;400;500;600;700',
  Work_Sans: 'Work+Sans:wght@300;400;500;600;700',
  DM_Sans: 'DM+Sans:wght@300;400;500;600;700',
  Outfit: 'Outfit:wght@300;400;500;600;700',
  Playfair_Display: 'Playfair+Display:wght@400;500;600;700',
  Merriweather: 'Merriweather:wght@300;400;700',
  Lora: 'Lora:wght@400;500;600;700',
  Source_Serif_4: 'Source+Serif+4:wght@300;400;500;600;700',
  Crimson_Text: 'Crimson+Text:wght@400;600;700',
  EB_Garamond: 'EB+Garamond:wght@400;500;600;700',
  Libre_Baskerville: 'Libre+Baskerville:wght@400;700',
  Cormorant_Garamond: 'Cormorant+Garamond:wght@300;400;500;600;700',
  Bitter: 'Bitter:wght@300;400;500;600;700',
  Spectral: 'Spectral:wght@300;400;500;600;700',
  // Monospace fonts
  JetBrains_Mono: 'JetBrains+Mono:wght@400;500;700',
  Fira_Code: 'Fira+Code:wght@400;500;700',
  Source_Code_Pro: 'Source+Code+Pro:wght@400;500;700',
  IBM_Plex_Mono: 'IBM+Plex+Mono:wght@400;500;700',
  Space_Mono: 'Space+Mono:wght@400;700',
  Roboto_Mono: 'Roboto+Mono:wght@400;500;700',
  Courier_Prime: 'Courier+Prime:wght@400;700',
  Anonymous_Pro: 'Anonymous+Pro:wght@400;700',
}

// Map font values to CSS font-family
const FONT_FAMILY_MAP: Record<string, string> = {
  Be_Vietnam_Pro: "'Be Vietnam Pro', sans-serif",
  'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  Inter: "'Inter', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Open_Sans: "'Open Sans', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Lato: "'Lato', sans-serif",
  Nunito: "'Nunito', sans-serif",
  Raleway: "'Raleway', sans-serif",
  Work_Sans: "'Work Sans', sans-serif",
  DM_Sans: "'DM Sans', sans-serif",
  Outfit: "'Outfit', sans-serif",
  Playfair_Display: "'Playfair Display', serif",
  Merriweather: "'Merriweather', serif",
  Lora: "'Lora', serif",
  Source_Serif_4: "'Source Serif 4', serif",
  Crimson_Text: "'Crimson Text', serif",
  EB_Garamond: "'EB Garamond', serif",
  Libre_Baskerville: "'Libre Baskerville', serif",
  Cormorant_Garamond: "'Cormorant Garamond', serif",
  Bitter: "'Bitter', serif",
  Spectral: "'Spectral', serif",
  // Monospace fonts
  JetBrains_Mono: "'JetBrains Mono', monospace",
  Fira_Code: "'Fira Code', monospace",
  Source_Code_Pro: "'Source Code Pro', monospace",
  IBM_Plex_Mono: "'IBM Plex Mono', monospace",
  Space_Mono: "'Space Mono', monospace",
  Roboto_Mono: "'Roboto Mono', monospace",
  Courier_Prime: "'Courier Prime', monospace",
  Anonymous_Pro: "'Anonymous Pro', monospace",
}

interface FontProviderProps {
  children: React.ReactNode
  initialHeadingFont?: string
  initialBodyFont?: string
  initialAccentFont?: string
}

// Font sizes are now stored as pt values directly (e.g., '12', '14', '16')
// and converted to pt units when applied

export default function FontProvider({ 
  children, 
  initialHeadingFont = 'Be_Vietnam_Pro',
  initialBodyFont = 'Merriweather',
  initialAccentFont = 'Space_Mono'
}: FontProviderProps) {
  const [headingFont, setHeadingFont] = useState(initialHeadingFont)
  const [bodyFont, setBodyFont] = useState(initialBodyFont)
  const [accentFont, setAccentFont] = useState(initialAccentFont)
  const [headingSize, setHeadingSize] = useState('32')
  const [bodySize, setBodySize] = useState('12')
  const [accentSize, setAccentSize] = useState('10')
  const [headingWeight, setHeadingWeight] = useState('700')
  const [bodyWeight, setBodyWeight] = useState('400')
  const [accentWeight, setAccentWeight] = useState('400')
  const [headingStyle, setHeadingStyle] = useState('normal')
  const [bodyStyle, setBodyStyle] = useState('normal')
  const [accentStyle, setAccentStyle] = useState('normal')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'typography')
          .single()

        if (data?.value) {
          const typography = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
          if (typography.heading_font) setHeadingFont(typography.heading_font)
          if (typography.body_font) setBodyFont(typography.body_font)
          if (typography.accent_font) setAccentFont(typography.accent_font)
          if (typography.heading_size) setHeadingSize(typography.heading_size)
          if (typography.body_size) setBodySize(typography.body_size)
          if (typography.accent_size) setAccentSize(typography.accent_size)
          if (typography.heading_weight) setHeadingWeight(typography.heading_weight)
          if (typography.body_weight) setBodyWeight(typography.body_weight)
          if (typography.accent_weight) setAccentWeight(typography.accent_weight)
          if (typography.heading_style) setHeadingStyle(typography.heading_style)
          if (typography.body_style) setBodyStyle(typography.body_style)
          if (typography.accent_style) setAccentStyle(typography.accent_style)
        }
      } catch (err) {
        console.error('Error loading typography settings:', err)
      } finally {
        setLoaded(true)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    // Load Google Fonts dynamically
    const fontsToLoad: string[] = []
    
    if (GOOGLE_FONT_MAP[headingFont]) {
      fontsToLoad.push(GOOGLE_FONT_MAP[headingFont])
    }
    if (GOOGLE_FONT_MAP[bodyFont] && bodyFont !== headingFont) {
      fontsToLoad.push(GOOGLE_FONT_MAP[bodyFont])
    }
    if (GOOGLE_FONT_MAP[accentFont] && accentFont !== headingFont && accentFont !== bodyFont) {
      fontsToLoad.push(GOOGLE_FONT_MAP[accentFont])
    }

    if (fontsToLoad.length > 0) {
      const linkId = 'dynamic-google-fonts'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      
      link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}`).join('&')}&display=swap`
    }

    // Set CSS variables
    document.documentElement.style.setProperty(
      '--font-heading',
      FONT_FAMILY_MAP[headingFont] || FONT_FAMILY_MAP['Be_Vietnam_Pro']
    )
    document.documentElement.style.setProperty(
      '--font-body',
      FONT_FAMILY_MAP[bodyFont] || FONT_FAMILY_MAP['Merriweather']
    )
    document.documentElement.style.setProperty(
      '--font-accent',
      FONT_FAMILY_MAP[accentFont] || FONT_FAMILY_MAP['Space_Mono']
    )
    // Set font sizes (values are stored as pt numbers like '12', '14', etc.)
    document.documentElement.style.setProperty(
      '--font-size-body',
      `${bodySize || '12'}pt`
    )
    document.documentElement.style.setProperty(
      '--font-size-accent',
      `${accentSize || '10'}pt`
    )
    document.documentElement.style.setProperty(
      '--font-size-heading',
      `${headingSize || '32'}pt`
    )
    // Set font weights
    document.documentElement.style.setProperty(
      '--font-weight-heading',
      headingWeight || '700'
    )
    document.documentElement.style.setProperty(
      '--font-weight-body',
      bodyWeight || '400'
    )
    document.documentElement.style.setProperty(
      '--font-weight-accent',
      accentWeight || '400'
    )
    // Set font styles
    document.documentElement.style.setProperty(
      '--font-style-heading',
      headingStyle || 'normal'
    )
    document.documentElement.style.setProperty(
      '--font-style-body',
      bodyStyle || 'normal'
    )
    document.documentElement.style.setProperty(
      '--font-style-accent',
      accentStyle || 'normal'
    )
  }, [headingFont, bodyFont, accentFont, headingSize, bodySize, accentSize, headingWeight, bodyWeight, accentWeight, headingStyle, bodyStyle, accentStyle])

  return <>{children}</>
}
