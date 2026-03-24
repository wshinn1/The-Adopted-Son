import { getHomepage, getSiteSettings } from '@/lib/site-settings'
import { createClient } from '@/lib/supabase/server'
import HomePageClient from '@/components/HomePageClient'
import PageRenderer from '@/components/PageRenderer'
import type { Metadata } from 'next'

const DEFAULT_OG = 'https://www.theadoptedson.com/og-image.jpg'
const BASE_URL = 'https://www.theadoptedson.com'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, homepage] = await Promise.all([getSiteSettings(), getHomepage()])
  const page = homepage?.page as any

  const title = page?.og_title || settings.site_name || 'The Adopted Son'
  const description = page?.og_description || settings.site_tagline || 'Faith-filled daily devotionals to draw you closer to God.'
  const ogImage = page?.og_image_url || DEFAULT_OG

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: BASE_URL,
      siteName: 'The Adopted Son',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: BASE_URL },
  }
}

export default async function HomePage() {
  const [homepage, supabase] = await Promise.all([getHomepage(), createClient()])

  if (!homepage || !homepage.sections || homepage.sections.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F0] px-6 text-center">
        <h1 className="text-3xl font-medium text-neutral-900">Welcome</h1>
        <p className="mt-4 text-neutral-600">No sections have been added to this page yet.</p>
        <p className="mt-2 text-sm text-neutral-500">Go to the admin dashboard to add sections.</p>
      </div>
    )
  }

  // Pre-fetch devotionals server-side for BlogGallery1 sections
  const hasBlogGallery = homepage.sections.some((s: any) => {
    const t = Array.isArray(s.section_templates) ? s.section_templates[0] : s.section_templates
    return t?.component_name === 'BlogGallery1'
  })

  let recentDevotionals: any[] = []
  if (hasBlogGallery) {
    const { data } = await supabase
      .from('devotionals')
      .select('id, title, slug, excerpt, cover_image_url, published_at, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(8)
    recentDevotionals = data ?? []
  }

  // Inject devotionals into BlogGallery1 section data
  const sections = homepage.sections.map((s: any) => {
    const t = Array.isArray(s.section_templates) ? s.section_templates[0] : s.section_templates
    if (t?.component_name === 'BlogGallery1') {
      return { ...s, data: { ...s.data, _devotionals: recentDevotionals } }
    }
    return s
  })

  return (
    <HomePageClient>
      <PageRenderer sections={sections} />
    </HomePageClient>
  )
}
