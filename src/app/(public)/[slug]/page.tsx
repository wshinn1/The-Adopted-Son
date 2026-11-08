import { getPageWithSections } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.theadoptedson.com'
const DEFAULT_OG = `${BASE_URL}/og-image.jpg`

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPageWithSections(slug)
  const page = data?.page as any

  if (!page) return {}

  const title = page.og_title || page.title || 'The Adopted Son'
  const description = page.og_description || page.meta_description || ''
  const ogImage = page.og_image_url || DEFAULT_OG
  const url = `${BASE_URL}/${slug}`

  return {
    title: `${title} — The Adopted Son`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'The Adopted Son',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const data = await getPageWithSections(slug)

  if (!data?.page) {
    notFound()
  }

  if (!data.sections || data.sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">This page has no content yet.</p>
      </div>
    )
  }

  return <PageRenderer sections={data.sections} />
}
