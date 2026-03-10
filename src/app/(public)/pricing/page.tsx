import { getSiteSettings, getPageWithSections } from '@/lib/site-settings'
import PageRenderer from '@/components/PageRenderer'

export const metadata = {
  title: 'Pricing',
  description: 'View our subscription plans',
}

export default async function PricingPage() {
  const settings = await getSiteSettings()
  const pageData = await getPageWithSections('pricing')

  // If there's a page in the database with sections, render them
  if (pageData?.sections && pageData.sections.length > 0) {
    return <PageRenderer sections={pageData.sections} />
  }

  // Otherwise show a simple placeholder with pricing info
  return (
    <div className="min-h-screen bg-[#f5f2ed] pt-24">
      <div className="mx-auto max-w-4xl px-6 py-16 md:px-12">
        <h1 className="text-center text-4xl font-medium text-neutral-900 md:text-5xl">
          Pricing
        </h1>
        <p className="mt-4 text-center text-lg text-neutral-600">
          Choose a plan that works for you
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8">
            <h2 className="text-2xl font-semibold text-neutral-900">Free</h2>
            <p className="mt-2 text-neutral-600">Get started with daily devotionals</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-neutral-900">$0</span>
              <span className="text-neutral-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-neutral-600">
              <li>Access to free devotionals</li>
              <li>Weekly email updates</li>
              <li>Community access</li>
            </ul>
            <a
              href="/auth/sign-up"
              className="mt-8 block w-full rounded-xl bg-neutral-900 py-3 text-center font-medium text-white hover:bg-neutral-800"
            >
              Get Started
            </a>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-neutral-900 bg-white p-8">
            <h2 className="text-2xl font-semibold text-neutral-900">Premium</h2>
            <p className="mt-2 text-neutral-600">Full access to all content</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-neutral-900">$9</span>
              <span className="text-neutral-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-neutral-600">
              <li>All free features</li>
              <li>Access to premium devotionals</li>
              <li>Exclusive content</li>
              <li>Early access to new content</li>
            </ul>
            <a
              href="/subscribe"
              className="mt-8 block w-full rounded-xl bg-neutral-900 py-3 text-center font-medium text-white hover:bg-neutral-800"
            >
              Subscribe
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          This page can be customized from the admin dashboard.
        </p>
      </div>
    </div>
  )
}
