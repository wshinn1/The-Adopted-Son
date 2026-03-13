'use client'

import useSWR from 'swr'
import { BarChart2, Users, Eye, TrendingUp, ExternalLink } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PROJECT_ID = '341992'
const POSTHOG_URL = 'https://us.posthog.com'

export default function AnalyticsStats() {
  const { data, error, isLoading } = useSWR('/api/analytics', fetcher, {
    refreshInterval: 60000, // refresh every 60s for near-realtime
  })

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pageviews (30d)"
          value={isLoading ? null : error ? '—' : data?.pageviews?.toLocaleString()}
          icon={Eye}
        />
        <StatCard
          label="Unique Visitors (30d)"
          value={isLoading ? null : error ? '—' : data?.uniqueVisitors?.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Avg Daily Views (7d)"
          value={
            isLoading
              ? null
              : error
                ? '—'
                : data?.dailyViews?.length
                  ? Math.round(
                      data.dailyViews.reduce((s: number, d: { views: number }) => s + d.views, 0) /
                        data.dailyViews.length,
                    ).toLocaleString()
                  : '0'
          }
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-500" />
            Top Pages (Last 30 Days)
          </h2>
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <ErrorMsg />
          ) : data?.topPages?.length ? (
            <ul className="space-y-2">
              {data.topPages.map((p: { page: string; views: number }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                    {p.page || '/'}
                  </span>
                  <span className="flex-shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
                    {p.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No data yet.</p>
          )}
        </div>

        {/* Daily views sparkline */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Daily Views (Last 7 Days)
          </h2>
          {isLoading ? (
            <SkeletonList rows={4} />
          ) : error ? (
            <ErrorMsg />
          ) : data?.dailyViews?.length ? (
            <ul className="space-y-2">
              {data.dailyViews.map((d: { day: string; views: number }, i: number) => {
                const max = Math.max(...data.dailyViews.map((x: { views: number }) => x.views), 1)
                const pct = Math.round((d.views / max) * 100)
                return (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-20 flex-shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{d.day}</span>
                    <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {d.views}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No data yet.</p>
          )}
        </div>
      </div>

      {/* Open PostHog link */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Full Dashboard</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Session replays, funnels, heatmaps, and more in PostHog.
          </p>
        </div>
        <a
          href={`${POSTHOG_URL}/project/${PROJECT_ID}/web-analytics`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Open in PostHog
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary-500" />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      </div>
      {value === null ? (
        <div className="h-8 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      )}
    </div>
  )
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      ))}
    </ul>
  )
}

function ErrorMsg() {
  return <p className="text-sm text-red-500">Failed to load analytics data.</p>
}
