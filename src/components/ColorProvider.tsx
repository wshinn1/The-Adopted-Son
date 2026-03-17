'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface SiteColors {
  button_primary: string
  button_primary_hover: string
  button_primary_text: string
  button_primary_hover_text: string
  category_badge_bg: string
  category_badge_text: string
  title_hover_color: string
  pagination_active_bg: string
  pagination_active_text: string
  newsletter_button_bg: string
  newsletter_button_text: string
  icon_button_bg: string
  icon_button_icon: string
  icon_button_hover_bg: string
  icon_button_hover_icon: string
}

const defaultColors: SiteColors = {
  button_primary: '#2B4A6F',
  button_primary_hover: '#1e3a5f',
  button_primary_text: '#ffffff',
  button_primary_hover_text: '#ffffff',
  category_badge_bg: '#4A3828',
  category_badge_text: '#ffffff',
  title_hover_color: '#E8A547',
  pagination_active_bg: '#2B4A6F',
  pagination_active_text: '#ffffff',
  newsletter_button_bg: '#2B4A6F',
  newsletter_button_text: '#ffffff',
  icon_button_bg: '#2B4A6F',
  icon_button_icon: '#ffffff',
  icon_button_hover_bg: '#1e3a5f',
  icon_button_hover_icon: '#ffffff',
}

export default function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<SiteColors>(defaultColors)

  useEffect(() => {
    const loadColors = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_colors')
          .single()

        if (!error && data?.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
          setColors({ ...defaultColors, ...parsed })
        }
      } catch (err) {
        console.error('Error loading site colors:', err)
      }
    }

    loadColors()
  }, [])

  // Apply colors as CSS custom properties
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-button-primary', colors.button_primary)
    root.style.setProperty('--color-button-primary-hover', colors.button_primary_hover)
    root.style.setProperty('--color-button-primary-text', colors.button_primary_text)
    root.style.setProperty('--color-button-primary-hover-text', colors.button_primary_hover_text)
    root.style.setProperty('--color-category-badge-bg', colors.category_badge_bg)
    root.style.setProperty('--color-category-badge-text', colors.category_badge_text)
    root.style.setProperty('--color-title-hover', colors.title_hover_color)
    root.style.setProperty('--color-pagination-active-bg', colors.pagination_active_bg)
    root.style.setProperty('--color-pagination-active-text', colors.pagination_active_text)
    root.style.setProperty('--color-newsletter-button-bg', colors.newsletter_button_bg)
    root.style.setProperty('--color-newsletter-button-text', colors.newsletter_button_text)
    root.style.setProperty('--color-icon-button-bg', colors.icon_button_bg)
    root.style.setProperty('--color-icon-button-icon', colors.icon_button_icon)
    root.style.setProperty('--color-icon-button-hover-bg', colors.icon_button_hover_bg)
    root.style.setProperty('--color-icon-button-hover-icon', colors.icon_button_hover_icon)
  }, [colors])

  return <>{children}</>
}
