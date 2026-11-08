import { supabaseAdmin } from '@/lib/supabase/admin'
import HeroSlider1Client, { type HeroSlider1Data, type SliderDevo } from './HeroSlider1Client'

interface Props {
  data: HeroSlider1Data
}

export default async function HeroSlider1({ data }: Props) {
  const sliderIds: string[] = data.selected_slider_devotional_ids ?? []
  const gridIds: string[] = data.selected_grid_devotional_ids ?? []

  const needsFetch = sliderIds.length > 0 || gridIds.length > 0
  let sliderDevotionals: SliderDevo[] = []
  let gridDevotionals: SliderDevo[] = []

  if (needsFetch) {
    const allIds = [...new Set([...sliderIds, ...gridIds])]
    const { data: rows } = await supabaseAdmin
      .from('devotionals')
      .select('id, title, slug, excerpt, cover_image_url, published_at, category')
      .in('id', allIds)
      .eq('is_published', true)

    const map = new Map((rows ?? []).map((d: SliderDevo) => [d.id, d]))
    sliderDevotionals = sliderIds.flatMap(id => map.has(id) ? [map.get(id)!] : [])
    gridDevotionals = gridIds.flatMap(id => map.has(id) ? [map.get(id)!] : [])
  }

  return (
    <HeroSlider1Client
      data={data}
      sliderDevotionals={sliderDevotionals}
      gridDevotionals={gridDevotionals}
    />
  )
}
