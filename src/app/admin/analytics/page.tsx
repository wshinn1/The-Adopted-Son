import { Metadata } from 'next'
import { ExternalLink, BarChart2, Users, Eye, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics' }

const PROJECT_ID = '341992'
const POSTHOG_URL = 'https://us.posthog.com'

export default function AnalyticsPage() {
  const links = [
    {
      label: 'Web Analytics',
      description: 'Pageviews, sessions, top pages, referrers',
      href: `${POSTHOG_URL}/project/${PROJECT_ID}/web-analytics`,
      icon: BarChart2,
    },
    {
      label: 'Live Events',
      description: 'Real-time visitor activity as it happens',
      href: `${POSTHOG_URL}/project/${PROJECT_ID}/activity/live-events`,
      icon: TrendingUp,
    },
    {
      label: 'Insights',
      description: 'Custom charts, funnels, and trends',
      href: `${POSTHOG_URL}/project/${PROJECT_ID}/insights`,
      icon: Eye,
    },
    {
      label: 'Persons',
      description: 'Individual visitor profiles and sessions',
      href: `${POSTHOG_URL}/project/${PROJECT_ID}/persons`,
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Visitor data powered by PostHog. Click any card to open the full dashboard.
        </p>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
        PostHog does not allow embedding in iframes for security reasons. Use the links below to open your analytics directly in PostHog.
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map(({ label, description, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Open full dashboard CTA */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Open Full PostHog Dashboard</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Access all analytics, session replays, heatmaps, and more.</p>
        </div>
        <a
          href={`${POSTHOG_URL}/project/${PROJECT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Open PostHog
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
