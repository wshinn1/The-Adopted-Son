import { Metadata } from 'next'
import AnalyticsStats from '@/components/admin/AnalyticsStats'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analytics</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time visitor data powered by PostHog. Refreshes every 60 seconds.
        </p>
      </div>
      <AnalyticsStats />
    </div>
  )
}
