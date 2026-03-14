'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { Activity, User } from 'lucide-react'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface RealtimeVisitor {
  id: string
  country: string
  countryCode: string
  city: string
  lat: number
  lng: number
  lastSeen: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RealtimeVisitorsMap() {
  const { data, error } = useSWR('/api/analytics/realtime', fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  })
  
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const visitors: RealtimeVisitor[] = data?.visitors || []
  const activeCount = data?.count || 0

  // Filter visitors that have valid coordinates
  const visibleVisitors = visitors.filter(v => v.lat && v.lng && v.lat !== 0 && v.lng !== 0)

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          Live Visitors
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
              {activeCount} active
            </span>
          )}
        </h2>
        <p className="text-xs text-neutral-500">Refreshes every 10 seconds</p>
      </div>
      
      <div className="relative h-[300px] bg-neutral-900">
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 147,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={[0, 20]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#2A2A2A"
                    stroke="#3A3A3A"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Visitor markers */}
            {visibleVisitors.map((visitor, index) => (
              <Marker
                key={`${visitor.id}-${index}`}
                coordinates={[visitor.lng, visitor.lat]}
                onMouseEnter={(e) => {
                  const location = visitor.city 
                    ? `${visitor.city}, ${visitor.country}` 
                    : visitor.country
                  setTooltipContent(location)
                  setTooltipPosition({ x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={() => setTooltipContent('')}
              >
                {/* Pulsing circle animation */}
                <circle
                  r={8}
                  fill="rgba(34, 197, 94, 0.3)"
                  className="animate-ping"
                />
                <circle
                  r={4}
                  fill="#22C55E"
                  stroke="#FFF"
                  strokeWidth={1}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div
            className="fixed z-50 px-2 py-1 bg-neutral-800 text-white text-xs rounded shadow-lg pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y + 10,
            }}
          >
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {tooltipContent}
            </div>
          </div>
        )}

        {/* No visitors message */}
        {visibleVisitors.length === 0 && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-neutral-500 text-sm">
              {activeCount > 0 
                ? 'Active visitors (location data unavailable)' 
                : 'No active visitors right now'
              }
            </p>
          </div>
        )}
      </div>

      {/* Active visitors list */}
      {visibleVisitors.length > 0 && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-wrap gap-2">
            {visibleVisitors.slice(0, 10).map((visitor, i) => (
              <span 
                key={`${visitor.id}-${i}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {visitor.city || visitor.country}
              </span>
            ))}
            {visibleVisitors.length > 10 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-neutral-500">
                +{visibleVisitors.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
