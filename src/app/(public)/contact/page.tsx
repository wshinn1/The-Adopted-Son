import { getPageWithSections } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'
import type { Metadata } from 'next'

const DEFAULT_OG = 'https://www.theadoptedson.com/og-image.jpg'

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageWithSections('contact')
  const page = data?.page as any

  const title = page?.og_title || 'Contact'
  const description = page?.og_description || 'Get in touch with The Adopted Son.'
  const ogImage = page?.og_image_url || DEFAULT_OG

  return {
    title,
    description,
    openGraph: {
      title: `${title} — The Adopted Son`,
      description,
      type: 'website',
      url: 'https://www.theadoptedson.com/contact',
      siteName: 'The Adopted Son',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — The Adopted Son`,
      description,
      images: [ogImage],
    },
    alternates: { canonical: 'https://www.theadoptedson.com/contact' },
  }
}

export default async function ContactPage() {
  const pageData = await getPageWithSections('contact')

  if (pageData?.sections && pageData.sections.length > 0) {
    return <PageRenderer sections={pageData.sections} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-neutral-500">Contact page coming soon.</p>
    </div>
  )
}
