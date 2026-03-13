import { getHomepage, getSiteSettings } from '@/lib/site-settings'
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
  const homepage = await getHomepage()

  if (!homepage || !homepage.sections || homepage.sections.length === 0) {
    // Show a placeholder if no sections exist yet
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F0] px-6 text-center">
        <h1 className="text-3xl font-medium text-neutral-900">Welcome</h1>
        <p className="mt-4 text-neutral-600">
          No sections have been added to this page yet.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Go to the admin dashboard to add sections.
        </p>
      </div>
    )
  }

  return <PageRenderer sections={homepage.sections} />
}
