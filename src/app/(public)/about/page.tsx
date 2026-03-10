import { getSiteSettings, getPageWithSections } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'

export const metadata = {
  title: 'About',
  description: 'Learn more about The Adopted Son',
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
        <h1 className="text-4xl font-medium text-neutral-900 md:text-5xl">
          About {settings.site_name}
        </h1>
        <div className="mt-8 space-y-6 text-lg text-neutral-600">
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
