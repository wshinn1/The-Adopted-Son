import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const PROJECT_ID = '341992'

// PostHog embeddable dashboard URLs
const DASHBOARDS = [
  {
    label: 'Web Analytics',
    // Web analytics built-in view
    src: `${POSTHOG_HOST}/embedded/web-analytics?projectId=${PROJECT_ID}`,
  },
]

export default function AnalyticsPage() {
  const posthogAppUrl =
    POSTHOG_HOST.includes('eu.')
      ? 'https://eu.posthog.com'
      : 'https://us.posthog.com'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time visitor data powered by PostHog
          </p>
        </div>
        <a
          href={`${posthogAppUrl}/project/${PROJECT_ID}/web-analytics`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2 transition-colors"
        >
          Open in PostHog
        </a>
      </div>

      {/* Embedded PostHog Web Analytics */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <iframe
          src={`${posthogAppUrl}/project/${PROJECT_ID}/web-analytics`}
          className="w-full"
          style={{ height: '85vh', border: 'none' }}
          title="PostHog Web Analytics"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
