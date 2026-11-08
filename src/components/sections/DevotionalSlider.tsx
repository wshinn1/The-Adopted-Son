import { supabaseAdmin } from '@/lib/supabase/admin'
import DevotionalSliderClient from './DevotionalSliderClient'

export interface DevotionalSliderData {
  selected_devotional_ids?: string[]
  slide_duration?: number
  show_remaining?: boolean
  background_color?: string
}

interface Props {
  data: DevotionalSliderData
}

export default async function DevotionalSlider({ data }: Props) {
  const selectedIds: string[] = data.selected_devotional_ids ?? []
  const slideDuration = data.slide_duration ?? 5
  const showRemaining = data.show_remaining !== false
  const backgroundColor = data.background_color ?? '#ffffff'

  const { data: rows } = await supabaseAdmin
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const all = rows ?? []

  // If specific IDs are chosen, preserve their order; otherwise show newest 3 in slider
  const sliderDevotionals = selectedIds.length > 0
    ? selectedIds.flatMap(id => all.filter(d => d.id === id))
    : all.slice(0, 3)

  const sliderIdSet = new Set(sliderDevotionals.map(d => d.id))
  const remainingDevotionals = showRemaining ? all.filter(d => !sliderIdSet.has(d.id)) : []

  return (
    <DevotionalSliderClient
      sliderDevotionals={sliderDevotionals}
      remainingDevotionals={remainingDevotionals}
      slideDuration={slideDuration}
      backgroundColor={backgroundColor}
    />
  )
}
