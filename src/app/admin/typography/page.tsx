'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const FONT_OPTIONS = [
  // System fonts
  { value: 'Be_Vietnam_Pro', label: 'Be Vietnam Pro (Default)', category: 'System' },
  { value: 'system-ui', label: 'System UI', category: 'System' },
  
  // Sans-serif Google Fonts
  { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
  { value: 'Open_Sans', label: 'Open Sans', category: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
  { value: 'Nunito', label: 'Nunito', category: 'Sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'Sans-serif' },
  { value: 'Work_Sans', label: 'Work Sans', category: 'Sans-serif' },
  { value: 'DM_Sans', label: 'DM Sans', category: 'Sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
  
  // Serif Google Fonts
  { value: 'Playfair_Display', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
  { value: 'Lora', label: 'Lora', category: 'Serif' },
  { value: 'Source_Serif_4', label: 'Source Serif 4', category: 'Serif' },
  { value: 'Crimson_Text', label: 'Crimson Text', category: 'Serif' },
  { value: 'EB_Garamond', label: 'EB Garamond', category: 'Serif' },
  { value: 'Libre_Baskerville', label: 'Libre Baskerville', category: 'Serif' },
  { value: 'Cormorant_Garamond', label: 'Cormorant Garamond', category: 'Serif' },
  { value: 'Bitter', label: 'Bitter', category: 'Serif' },
  { value: 'Spectral', label: 'Spectral', category: 'Serif' },
  
  // Monospace Google Fonts
  { value: 'JetBrains_Mono', label: 'JetBrains Mono', category: 'Monospace' },
  { value: 'Fira_Code', label: 'Fira Code', category: 'Monospace' },
  { value: 'Source_Code_Pro', label: 'Source Code Pro', category: 'Monospace' },
  { value: 'IBM_Plex_Mono', label: 'IBM Plex Mono', category: 'Monospace' },
  { value: 'Space_Mono', label: 'Space Mono', category: 'Monospace' },
  { value: 'Roboto_Mono', label: 'Roboto Mono', category: 'Monospace' },
  { value: 'Courier_Prime', label: 'Courier Prime', category: 'Monospace' },
  { value: 'Anonymous_Pro', label: 'Anonymous Pro', category: 'Monospace' },
]

const FONT_SIZE_OPTIONS = [
  { value: '8', label: '8 pt' },
  { value: '9', label: '9 pt' },
  { value: '10', label: '10 pt' },
  { value: '11', label: '11 pt' },
  { value: '12', label: '12 pt (Default)' },
  { value: '13', label: '13 pt' },
  { value: '14', label: '14 pt' },
  { value: '16', label: '16 pt' },
  { value: '18', label: '18 pt' },
  { value: '20', label: '20 pt' },
  { value: '22', label: '22 pt' },
  { value: '24', label: '24 pt' },
]

const HEADING_SIZE_OPTIONS = [
  { value: '18', label: '18 pt' },
  { value: '20', label: '20 pt' },
  { value: '24', label: '24 pt' },
  { value: '28', label: '28 pt' },
  { value: '32', label: '32 pt (Default)' },
  { value: '36', label: '36 pt' },
  { value: '40', label: '40 pt' },
  { value: '48', label: '48 pt' },
  { value: '56', label: '56 pt' },
  { value: '64', label: '64 pt' },
]

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular (Default)' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
]

const groupedFonts = FONT_OPTIONS.reduce((acc, font) => {
  if (!acc[font.category]) acc[font.category] = []
  acc[font.category].push(font)
  return acc
}, {} as Record<string, typeof FONT_OPTIONS>)

export default function TypographyPage() {
  const [headingFont, setHeadingFont] = useState('font-sans')
  const [bodyFont, setBodyFont] = useState('font-serif')
  const [accentFont, setAccentFont] = useState('Space_Mono')
  const [headingSize, setHeadingSize] = useState('32')
  const [bodySize, setBodySize] = useState('12')
  const [accentSize, setAccentSize] = useState('10')
  const [headingWeight, setHeadingWeight] = useState('700')
  const [bodyWeight, setBodyWeight] = useState('400')
  const [accentWeight, setAccentWeight] = useState('400')
  const [headingStyle, setHeadingStyle] = useState('normal')
  const [bodyStyle, setBodyStyle] = useState('normal')
  const [accentStyle, setAccentStyle] = useState('normal')
  const [captionFont, setCaptionFont] = useState('Lora')
  const [captionSize, setCaptionSize] = useState('10')
  const [captionWeight, setCaptionWeight] = useState('400')
  const [captionStyle, setCaptionStyle] = useState('italic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
  }, [])

  // Load preview fonts dynamically
  useEffect(() => {
    const GOOGLE_FONT_MAP: Record<string, string> = {
      Inter: 'Inter:wght@400;700',
      Poppins: 'Poppins:wght@400;700',
      Open_Sans: 'Open+Sans:wght@400;700',
      Montserrat: 'Montserrat:wght@400;700',
      Lato: 'Lato:wght@400;700',
      Nunito: 'Nunito:wght@400;700',
      Raleway: 'Raleway:wght@400;700',
      Work_Sans: 'Work+Sans:wght@400;700',
      DM_Sans: 'DM+Sans:wght@400;700',
      Outfit: 'Outfit:wght@400;700',
      Playfair_Display: 'Playfair+Display:wght@400;700',
      Merriweather: 'Merriweather:wght@400;700',
      Lora: 'Lora:wght@400;700',
      Source_Serif_4: 'Source+Serif+4:wght@400;700',
      Crimson_Text: 'Crimson+Text:wght@400;700',
      EB_Garamond: 'EB+Garamond:wght@400;700',
      Libre_Baskerville: 'Libre+Baskerville:wght@400;700',
      Cormorant_Garamond: 'Cormorant+Garamond:wght@400;700',
      Bitter: 'Bitter:wght@400;700',
      Spectral: 'Spectral:wght@400;700',
      JetBrains_Mono: 'JetBrains+Mono:wght@400;500;700',
      Fira_Code: 'Fira+Code:wght@400;500;700',
      Source_Code_Pro: 'Source+Code+Pro:wght@400;500;700',
      IBM_Plex_Mono: 'IBM+Plex+Mono:wght@400;500;700',
      Space_Mono: 'Space+Mono:wght@400;700',
      Roboto_Mono: 'Roboto+Mono:wght@400;500;700',
      Courier_Prime: 'Courier+Prime:wght@400;700',
      Anonymous_Pro: 'Anonymous+Pro:wght@400;700',
    }

    const fontsToLoad: string[] = []
    if (GOOGLE_FONT_MAP[headingFont]) fontsToLoad.push(GOOGLE_FONT_MAP[headingFont])
    if (GOOGLE_FONT_MAP[bodyFont] && bodyFont !== headingFont) fontsToLoad.push(GOOGLE_FONT_MAP[bodyFont])
    if (GOOGLE_FONT_MAP[accentFont] && accentFont !== headingFont && accentFont !== bodyFont) fontsToLoad.push(GOOGLE_FONT_MAP[accentFont])
    if (GOOGLE_FONT_MAP[captionFont] && captionFont !== headingFont && captionFont !== bodyFont && captionFont !== accentFont) fontsToLoad.push(GOOGLE_FONT_MAP[captionFont])

    if (fontsToLoad.length > 0) {
      const linkId = 'admin-preview-fonts'
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}`).join('&')}&display=swap`
    }
  }, [headingFont, bodyFont, accentFont, captionFont])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'typography')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data?.value) {
        const typography = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        setHeadingFont(typography.heading_font || 'font-sans')
        setBodyFont(typography.body_font || 'font-serif')
        setAccentFont(typography.accent_font || 'Space_Mono')
        setHeadingSize(typography.heading_size || '32')
        setBodySize(typography.body_size || '12')
        setAccentSize(typography.accent_size || '10')
        setHeadingWeight(typography.heading_weight || '700')
        setBodyWeight(typography.body_weight || '400')
        setAccentWeight(typography.accent_weight || '400')
        setHeadingStyle(typography.heading_style || 'normal')
        setBodyStyle(typography.body_style || 'normal')
        setAccentStyle(typography.accent_style || 'normal')
        setCaptionFont(typography.caption_font || 'Lora')
        setCaptionSize(typography.caption_size || '10')
        setCaptionWeight(typography.caption_weight || '400')
        setCaptionStyle(typography.caption_style || 'italic')
      }
    } catch (err) {
      console.error('Error loading typography settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'typography',
          value: JSON.stringify({
            heading_font: headingFont,
            body_font: bodyFont,
            accent_font: accentFont,
            heading_size: headingSize,
            body_size: bodySize,
            accent_size: accentSize,
            heading_weight: headingWeight,
            body_weight: bodyWeight,
            accent_weight: accentWeight,
            heading_style: headingStyle,
            body_style: bodyStyle,
            accent_style: accentStyle,
            caption_font: captionFont,
            caption_size: captionSize,
            caption_weight: captionWeight,
            caption_style: captionStyle,
          })
        }, { onConflict: 'key' })

      if (error) throw error
      alert('Typography settings saved!')
    } catch (err) {
      console.error('Error saving typography:', err)
      alert('Error saving typography settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-neutral-500">Loading typography settings...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        Typography
      </h1>

      <div className="space-y-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Font Settings</h2>
          
          <div className="space-y-6">
            {/* Heading Font */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Heading Font
                </label>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {Object.entries(groupedFonts).map(([category, fonts]) => (
                    <optgroup key={category} label={category}>
                      {fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Size
                </label>
                <select
                  value={headingSize}
                  onChange={(e) => setHeadingSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {HEADING_SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Weight
                  </label>
                  <select
                    value={headingWeight}
                    onChange={(e) => setHeadingWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Style
                  </label>
                  <select
                    value={headingStyle}
                    onChange={(e) => setHeadingStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_STYLE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Body Font */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Body Font
                </label>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {Object.entries(groupedFonts).map(([category, fonts]) => (
                    <optgroup key={category} label={category}>
                      {fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Size
                </label>
                <select
                  value={bodySize}
                  onChange={(e) => setBodySize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Weight
                  </label>
                  <select
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Style
                  </label>
                  <select
                    value={bodyStyle}
                    onChange={(e) => setBodyStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_STYLE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Accent Font */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Accent Font
                </label>
                <select
                  value={accentFont}
                  onChange={(e) => setAccentFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {Object.entries(groupedFonts).map(([category, fonts]) => (
                    <optgroup key={category} label={category}>
                      {fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">Used for taglines, labels, and decorative text</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Size
                </label>
                <select
                  value={accentSize}
                  onChange={(e) => setAccentSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Weight
                  </label>
                  <select
                    value={accentWeight}
                    onChange={(e) => setAccentWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Style
                  </label>
                  <select
                    value={accentStyle}
                    onChange={(e) => setAccentStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_STYLE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Caption Font */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Caption Font
                </label>
                <select
                  value={captionFont}
                  onChange={(e) => setCaptionFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {Object.entries(groupedFonts).map(([category, fonts]) => (
                    <optgroup key={category} label={category}>
                      {fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">Used for image captions and credits</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Size
                </label>
                <select
                  value={captionSize}
                  onChange={(e) => setCaptionSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Weight
                  </label>
                  <select
                    value={captionWeight}
                    onChange={(e) => setCaptionWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Style
                  </label>
                  <select
                    value={captionStyle}
                    onChange={(e) => setCaptionStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {FONT_STYLE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Font Preview */}
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-xs text-neutral-500 mb-3">Preview (save to see changes on your site):</p>
              <p 
                className="tracking-[0.2em] uppercase text-neutral-500 mb-2"
                style={{ 
                  fontFamily: `'${accentFont.replace(/_/g, ' ')}', monospace`,
                  fontSize: `${accentSize}pt`,
                  fontWeight: accentWeight,
                  fontStyle: accentStyle,
                }}
              >
                Accent text example
              </p>
              <h3 
                className="text-neutral-900 dark:text-neutral-100 mb-2"
                style={{ 
                  fontFamily: `'${headingFont.replace(/_/g, ' ')}', sans-serif`,
                  fontSize: `${headingSize}pt`,
                  fontWeight: headingWeight,
                  fontStyle: headingStyle,
                }}
              >
                Sample Heading Text
              </h3>
              <p 
                className="text-neutral-700 dark:text-neutral-300"
                style={{ 
                  fontFamily: `'${bodyFont.replace(/_/g, ' ')}', serif`,
                  fontSize: `${bodySize}pt`,
                  fontWeight: bodyWeight,
                  fontStyle: bodyStyle,
                }}
              >
                This is how your body text will appear in blog posts. The quick brown fox jumps over the lazy dog.
              </p>
              <p 
                className="text-neutral-500 mt-3"
                style={{ 
                  fontFamily: `'${captionFont.replace(/_/g, ' ')}', serif`,
                  fontSize: `${captionSize}pt`,
                  fontWeight: captionWeight,
                  fontStyle: captionStyle,
                }}
              >
                Photo caption example - Image credit or description
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Typography Settings'}
        </button>
      </div>
    </div>
  )
}
