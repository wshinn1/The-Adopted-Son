'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Map font values to Google Fonts API format (includes italic variants)
const GOOGLE_FONT_MAP: Record<string, string> = {
  Inter: 'Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Poppins: 'Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Open_Sans: 'Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Montserrat: 'Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Lato: 'Lato:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
  Nunito: 'Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Raleway: 'Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Work_Sans: 'Work+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  DM_Sans: 'DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Outfit: 'Outfit:wght@300;400;500;600;700',
  Playfair_Display: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
  Merriweather: 'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
  Lora: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
  Source_Serif_4: 'Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Crimson_Text: 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700',
  EB_Garamond: 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
  Libre_Baskerville: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  Cormorant_Garamond: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Bitter: 'Bitter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  Spectral: 'Spectral:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
  // Monospace fonts (most don't have italics, using oblique styles where available)
  JetBrains_Mono: 'JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700',
  Fira_Code: 'Fira+Code:wght@400;500;700',
  Source_Code_Pro: 'Source+Code+Pro:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700',
  IBM_Plex_Mono: 'IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700',
  Space_Mono: 'Space+Mono:ital,wght@0,400;0,700;1,400;1,700',
  Roboto_Mono: 'Roboto+Mono:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700',
  Courier_Prime: 'Courier+Prime:ital,wght@0,400;0,700;1,400;1,700',
  Anonymous_Pro: 'Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700',
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

interface TypographySettings {
  heading_font?: string
  body_font?: string
  accent_font?: string
  heading_size?: string
  body_size?: string
  accent_size?: string
  heading_weight?: string
  body_weight?: string
  accent_weight?: string
  heading_style?: string
  body_style?: string
  accent_style?: string
  caption_font?: string
  caption_size?: string
  caption_weight?: string
  caption_style?: string
  hero_font?: string
  hero_size?: string
  hero_weight?: string
  hero_style?: string
}

interface FontProviderProps {
  children: React.ReactNode
  initialTypography?: TypographySettings
}

// Font sizes are now stored as pt values directly (e.g., '12', '14', '16')
// and converted to pt units when applied

export default function FontProvider({ 
  children, 
  initialTypography
}: FontProviderProps) {
  const [headingFont, setHeadingFont] = useState(initialTypography?.heading_font || 'Be_Vietnam_Pro')
  const [bodyFont, setBodyFont] = useState(initialTypography?.body_font || 'Merriweather')
  const [accentFont, setAccentFont] = useState(initialTypography?.accent_font || 'Space_Mono')
  const [headingSize, setHeadingSize] = useState(initialTypography?.heading_size || '32')
  const [bodySize, setBodySize] = useState(initialTypography?.body_size || '12')
  const [accentSize, setAccentSize] = useState(initialTypography?.accent_size || '10')
  const [headingWeight, setHeadingWeight] = useState(initialTypography?.heading_weight || '700')
  const [bodyWeight, setBodyWeight] = useState(initialTypography?.body_weight || '400')
  const [accentWeight, setAccentWeight] = useState(initialTypography?.accent_weight || '400')
  const [headingStyle, setHeadingStyle] = useState(initialTypography?.heading_style || 'normal')
  const [bodyStyle, setBodyStyle] = useState(initialTypography?.body_style || 'normal')
  const [accentStyle, setAccentStyle] = useState(initialTypography?.accent_style || 'normal')
  const [captionFont, setCaptionFont] = useState(initialTypography?.caption_font || 'Lora')
  const [captionSize, setCaptionSize] = useState(initialTypography?.caption_size || '10')
  const [captionWeight, setCaptionWeight] = useState(initialTypography?.caption_weight || '400')
  const [captionStyle, setCaptionStyle] = useState(initialTypography?.caption_style || 'italic')
  const [heroFont, setHeroFont] = useState(initialTypography?.hero_font || 'Raleway')
  const [heroSize, setHeroSize] = useState(initialTypography?.hero_size || '48')
  const [heroWeight, setHeroWeight] = useState(initialTypography?.hero_weight || '700')
  const [heroStyle, setHeroStyle] = useState(initialTypography?.hero_style || 'italic')
  const [hasFetched, setHasFetched] = useState(!!initialTypography)

  useEffect(() => {
    // Skip fetch if we have initial typography from server
    if (hasFetched) return

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
          if (typography.caption_font) setCaptionFont(typography.caption_font)
          if (typography.caption_size) setCaptionSize(typography.caption_size)
          if (typography.caption_weight) setCaptionWeight(typography.caption_weight)
          if (typography.caption_style) setCaptionStyle(typography.caption_style)
          if (typography.hero_font) setHeroFont(typography.hero_font)
          if (typography.hero_size) setHeroSize(typography.hero_size)
          if (typography.hero_weight) setHeroWeight(typography.hero_weight)
          if (typography.hero_style) setHeroStyle(typography.hero_style)
          console.log('[v0] Loaded hero typography:', { 
            hero_font: typography.hero_font, 
            hero_size: typography.hero_size,
            hero_weight: typography.hero_weight, 
            hero_style: typography.hero_style 
          })
        }
      } catch (err) {
        console.error('Error loading typography settings:', err)
      } finally {
        setHasFetched(true)
      }
    }

    loadSettings()
  }, [hasFetched])

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
    if (GOOGLE_FONT_MAP[captionFont] && captionFont !== headingFont && captionFont !== bodyFont && captionFont !== accentFont) {
      fontsToLoad.push(GOOGLE_FONT_MAP[captionFont])
    }
    if (GOOGLE_FONT_MAP[heroFont] && heroFont !== headingFont && heroFont !== bodyFont && heroFont !== accentFont && heroFont !== captionFont) {
      fontsToLoad.push(GOOGLE_FONT_MAP[heroFont])
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
    // Caption font
    document.documentElement.style.setProperty(
      '--font-caption',
      FONT_FAMILY_MAP[captionFont] || FONT_FAMILY_MAP['Lora']
    )
    document.documentElement.style.setProperty(
      '--font-size-caption',
      `${captionSize || '10'}pt`
    )
    document.documentElement.style.setProperty(
      '--font-weight-caption',
      captionWeight || '400'
    )
    document.documentElement.style.setProperty(
      '--font-style-caption',
      captionStyle || 'italic'
    )
    // Hero font
    document.documentElement.style.setProperty(
      '--font-hero',
      FONT_FAMILY_MAP[heroFont] || FONT_FAMILY_MAP['Raleway']
    )
    document.documentElement.style.setProperty(
      '--font-size-hero',
      `${heroSize || '48'}pt`
    )
    document.documentElement.style.setProperty(
      '--font-weight-hero',
      heroWeight || '700'
    )
    document.documentElement.style.setProperty(
      '--font-style-hero',
      heroStyle || 'italic'
    )
    console.log('[v0] Applied hero CSS vars:', {
      fontHero: FONT_FAMILY_MAP[heroFont] || FONT_FAMILY_MAP['Raleway'],
      sizeHero: `${heroSize || '48'}pt`,
      weightHero: heroWeight || '700',
      styleHero: heroStyle || 'italic'
    })
  }, [headingFont, bodyFont, accentFont, captionFont, heroFont, headingSize, bodySize, accentSize, captionSize, heroSize, headingWeight, bodyWeight, accentWeight, captionWeight, heroWeight, headingStyle, bodyStyle, accentStyle, captionStyle, heroStyle])

  return <>{children}</>
}
