import { getHomepage, getSiteSettings } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: settings.site_name,
    description: settings.site_tagline,
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
