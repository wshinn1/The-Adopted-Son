import { getSiteSettings, getPageWithSections } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'

export const metadata = {
  title: 'About',
  description: 'Learn more about The Adopted Son — a daily devotional ministry rooted in faith, Scripture, and the love of God.',
  openGraph: {
    title: 'About — The Adopted Son',
    description: 'Learn more about The Adopted Son — a daily devotional ministry rooted in faith, Scripture, and the love of God.',
    type: 'website',
    url: 'https://www.theadoptedson.com/about',
    siteName: 'The Adopted Son',
    images: [
      {
        url: 'https://www.theadoptedson.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About — The Adopted Son',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — The Adopted Son',
    description: 'Learn more about The Adopted Son — a daily devotional ministry rooted in faith, Scripture, and the love of God.',
    images: ['https://www.theadoptedson.com/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.theadoptedson.com/about',
  },
}

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const pageData = await getPageWithSections('about')

  // If there's a page in the database with sections, render them
  if (pageData?.sections && pageData.sections.length > 0) {
    return <PageRenderer sections={pageData.sections} />
  }

  // Otherwise show a simple placeholder
  return (
    <div className="min-h-screen bg-[#f5f2ed] pt-24">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
        <h1 className="text-4xl font-medium text-neutral-900 md:text-5xl font-heading">
          About {settings.site_name}
        </h1>
        <div className="mt-8 space-y-6 text-lg text-neutral-600 font-body">
          <p>
            Welcome to {settings.site_name}. This page can be customized from the admin dashboard.
          </p>
          <p>
            Go to Admin &rarr; Pages to create an &ldquo;about&rdquo; page with custom sections.
          </p>
        </div>
      </div>
    </div>
  )
}
