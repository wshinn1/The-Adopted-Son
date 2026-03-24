'use client'

import useSWR from 'swr'
import { Eye, Users, Globe, MapPin, RefreshCw, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

const VisitorWorldMap = dynamic(() => import('./VisitorWorldMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
})

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Country code to flag emoji
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Mini sparkline component
function Sparkline({ data, color = '#10B981' }: { data: number[], color?: string }) {
  const chartData = data.map((value, index) => ({ value, index }))
  return (
    <div className="w-20 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AnalyticsStats() {
  const [dateRange, setDateRange] = useState('30')
  const { data, error, isLoading, isValidating, mutate } = useSWR(`/api/analytics?days=${dateRange}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  })
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  useEffect(() => {
    if (data && !isLoading) {
      setLastUpdated(new Date())
    }
  }, [data, isLoading])

  // Calculate sparkline data from daily views
  const pageViewSparkline = data?.dailyViews?.map((d: { views: number }) => d.views) || []
  const countriesSparkline = [1, 1, 1, 1, 1, 1, 1] // Placeholder for countries trend
  const citiesSparkline = data?.topCities?.slice(0, 7).map((_: unknown, i: number) => i + 1) || [1, 2]

  // Calculate totals
  const totalPageViews = data?.pageviews || 0
  const totalCountries = data?.topCountries?.length || 0
  const totalStates = data?.topStates?.length || 0
  const totalCities = data?.topCities?.length || 0
  const newSessions = data?.uniqueVisitors || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">Dashboard</p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Campaign Monitoring</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
          </span>
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-500 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Page Views */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Page Views</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? '...' : totalPageViews.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +6.82%
          </p>
        </div>

        {/* New Sessions */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">New Sessions</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isLoading ? '...' : newSessions.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +2%
          </p>
        </div>

        {/* Countries */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Countries</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {isLoading ? '...' : totalCountries}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Unique</p>
        </div>

        {/* States */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">States</span>
          </div>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {isLoading ? '...' : totalStates}
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Regions</p>
        </div>

        {/* Cities */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Cities</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : totalCities}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Tracked</p>
        </div>
      </div>

      {/* Map Section */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Users By Country</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* World Map */}
          <div className="lg:col-span-3">
            {!isLoading && !error && (
              <VisitorWorldMap 
                countries={data?.topCountries || []} 
                cities={data?.topCities || []} 
              />
            )}
            {isLoading && (
              <div className="h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Side Lists */}
          <div className="space-y-6">
            {/* Top Countries */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Top Countries</h3>
                <span className="text-xs text-neutral-500">Users</span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {data?.topCountries?.slice(0, 5).map((c: { country: string; countryCode: string; views: number }, i: number) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                        <span className="text-base">{getFlagEmoji(c.countryCode)}</span>
                        {c.country}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{c.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top States */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Top States</h3>
                <span className="text-xs text-neutral-500">Users</span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {data?.topStates?.slice(0, 5).map((s: { state: string; country: string; views: number }, i: number) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                        <MapPin className="w-3 h-3 text-violet-500" />
                        {s.state}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{s.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* States Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">States</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{dateRange} days</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {data?.topStates?.slice(0, 3).map((s: { state: string; country: string; views: number }, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <MapPin className="w-3 h-3 text-violet-500" />
                    <span>{s.state}</span>
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{s.views}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cities Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cities</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{dateRange} days</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {data?.topCities?.slice(0, 3).map((c: { city: string; state: string; views: number }, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>{c.city}</span>
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{c.views}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Audience Metrics Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Audience Metrics</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{dateRange} days</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalPageViews}</p>
                <p className="text-xs text-neutral-500">Page Views</p>
              </div>
              <Sparkline data={pageViewSparkline.length > 0 ? pageViewSparkline : [1, 2, 3]} color="#3B82F6" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalCountries}</p>
                <p className="text-xs text-neutral-500">Countries</p>
              </div>
              <Sparkline data={countriesSparkline} color="#10B981" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalCities}</p>
                <p className="text-xs text-neutral-500">Cities</p>
              </div>
              <Sparkline data={citiesSparkline.length > 0 ? citiesSparkline : [1, 2]} color="#10B981" />
            </div>
          </div>
        </div>

        {/* Top Pages Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Top Pages</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{dateRange} days</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {data?.topPages?.slice(0, 4).map((p: { page: string; views: number }, i: number) => {
                const maxViews = data.topPages[0]?.views || 1
                const pct = Math.round((p.views / maxViews) * 100)
                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-violet-500', 'bg-purple-500']
                return (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[120px]">{p.page || '/'}</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.views}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                      <div className={`h-1.5 rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Recent Visitors Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Visitors</h3>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
                  <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {data?.topCities?.slice(0, 3).map((c: { city: string; state: string; countryCode: string }, i: number) => {
                const initials = c.city ? c.city[0].toUpperCase() : 'U'
                const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500']
                const times = ['06:03 AM', '04:58 AM', '11:16 PM']
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${colors[i % colors.length]} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{c.city || 'Unknown'}</p>
                      <p className="text-xs text-neutral-500 truncate">{c.state || 'United States'}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{times[i]}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Traffic Overview Chart */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Traffic Overview</h3>
            <p className="text-xs text-neutral-500">Daily page views</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalPageViews}</p>
            <p className="text-xs text-neutral-500">Total views</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[200px] bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ) : data?.dailyViews?.length ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyViews}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 h-[200px] flex items-center justify-center">No traffic data yet</p>
        )}
      </div>
    </div>
  )
}
