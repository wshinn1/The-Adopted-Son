'use client'

import useSWR from 'swr'
import { BarChart2, Users, Eye, TrendingUp, ExternalLink, Globe, MapPin, RefreshCw, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const VisitorWorldMap = dynamic(() => import('./VisitorWorldMap'), { 
  ssr: false,
  loading: () => <div className="h-[500px] bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
})

const RealtimeVisitorsMap = dynamic(() => import('./RealtimeVisitorsMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
})

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PROJECT_ID = '341992'
const POSTHOG_URL = 'https://us.posthog.com'

export default function AnalyticsStats() {
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/analytics', fetcher, {
    refreshInterval: 10000, // refresh every 10s for near-realtime updates
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  })
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  useEffect(() => {
    if (data && !isLoading) {
      setLastUpdated(new Date())
      console.log('[v0] Analytics data received:', data)
    }
    if (error) {
      console.error('[v0] Analytics error:', error)
    }
  }, [data, isLoading, error])

  return (
    <div className="space-y-8">
      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          {isValidating && (
            <RefreshCw className="w-3 h-3 animate-spin" />
          )}
          <span>
            {isLoading ? 'Loading...' : isValidating ? 'Updating...' : lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
        </div>
        <button 
          onClick={() => mutate()}
          className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh now
        </button>
      </div>
      {/* Active users - real-time indicator */}
      <div className="rounded-xl border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">Active Now (last 5 min)</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {isLoading ? '...' : error ? '—' : data?.activeUsers ?? 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-600/70 dark:text-green-400/70">
            Visitors must accept cookies to be tracked
          </p>
        </div>
      </div>

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
            Top Pages (Last {data?.lookbackDays || 7} Days)
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
            <p className="text-sm text-neutral-400">No data yet. Data will appear as visitors browse your site.</p>
          )}
        </div>

        {/* Top devotionals */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-green-500" />
            Top Devotionals (Last {data?.lookbackDays || 7} Days)
          </h2>
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <ErrorMsg />
          ) : data?.topDevotionals?.length ? (
            <ul className="space-y-2">
              {data.topDevotionals.map((p: { page: string; views: number }, i: number) => {
                // Extract the slug from the URL for a cleaner display
                const slug = p.page?.split('/devotionals/').pop()?.split('?')[0] || p.page
                return (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-neutral-700 dark:text-neutral-300 text-xs" title={p.page}>
                      {slug}
                    </span>
                    <span className="flex-shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
                      {p.views.toLocaleString()}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No devotional views yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <p className="text-sm text-neutral-400">No data yet. Data will appear as visitors browse your site.</p>
          )}
        </div>
      </div>

      {/* Real-time Visitors Map */}
      <RealtimeVisitorsMap />

      {/* World Map */}
      {!isLoading && !error && data?.topCountries?.length > 0 && (
        <VisitorWorldMap 
          countries={data.topCountries} 
          cities={data.topCities || []} 
        />
      )}

      {/* Location data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top countries */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-500" />
            Top Countries (Last {data?.lookbackDays || 7} Days)
          </h2>
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <ErrorMsg />
          ) : data?.topCountries?.length ? (
            <ul className="space-y-2">
              {data.topCountries.slice(0, 10).map((c: { country: string; countryCode: string; views: number }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">
                    {c.country}
                  </span>
                  <span className="flex-shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
                    {c.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No location data yet.</p>
          )}
        </div>

        {/* Top cities */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" />
            Top Cities (Last {data?.lookbackDays || 7} Days)
          </h2>
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : error ? (
            <ErrorMsg />
          ) : data?.topCities?.length ? (
            <ul className="space-y-2">
              {data.topCities.slice(0, 10).map((c: { city: string; state: string; countryCode: string; views: number }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">
                    {c.city}{c.state ? `, ${c.state}` : ''} <span className="text-neutral-400 text-xs">({c.countryCode})</span>
                  </span>
                  <span className="flex-shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
                    {c.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-400">No location data yet.</p>
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
