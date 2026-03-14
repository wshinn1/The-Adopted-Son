'use client'

import { useState, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { X, Globe, MapPin } from 'lucide-react'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO Alpha-3 to ISO Alpha-2 mapping for reverse lookup
const alpha3ToAlpha2: Record<string, string> = {
  'USA': 'US', 'CAN': 'CA', 'GBR': 'GB', 'DEU': 'DE', 'FRA': 'FR', 'ITA': 'IT', 
  'ESP': 'ES', 'PRT': 'PT', 'NLD': 'NL', 'BEL': 'BE', 'CHE': 'CH', 'AUT': 'AT',
  'AUS': 'AU', 'NZL': 'NZ', 'JPN': 'JP', 'KOR': 'KR', 'CHN': 'CN', 'IND': 'IN',
  'BRA': 'BR', 'MEX': 'MX', 'ARG': 'AR', 'CHL': 'CL', 'COL': 'CO', 'PER': 'PE',
  'RUS': 'RU', 'UKR': 'UA', 'POL': 'PL', 'SWE': 'SE', 'NOR': 'NO', 'DNK': 'DK',
  'FIN': 'FI', 'IRL': 'IE', 'ZAF': 'ZA', 'EGY': 'EG', 'NGA': 'NG', 'KEN': 'KE',
  'ISR': 'IL', 'ARE': 'AE', 'SAU': 'SA', 'TUR': 'TR', 'GRC': 'GR', 'CZE': 'CZ',
  'HUN': 'HU', 'ROU': 'RO', 'THA': 'TH', 'VNM': 'VN', 'MYS': 'MY', 'SGP': 'SG',
  'IDN': 'ID', 'PHL': 'PH', 'PAK': 'PK', 'BGD': 'BD', 'HKG': 'HK', 'TWN': 'TW',
}

// ISO Alpha-2 to ISO Alpha-3 mapping for country codes
const alpha2ToAlpha3: Record<string, string> = Object.fromEntries(
  Object.entries(alpha3ToAlpha2).map(([k, v]) => [v, k])
)

interface CountryData {
  country: string
  countryCode: string
  views: number
}

interface CityData {
  city: string
  state: string
  countryCode: string
  country: string
  views: number
}

interface VisitorWorldMapProps {
  countries: CountryData[]
  cities: CityData[]
}

export default function VisitorWorldMap({ countries, cities }: VisitorWorldMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Create lookup for country data by both Alpha-2 and Alpha-3 codes
  const countryLookup = useMemo(() => {
    const lookup: Record<string, CountryData> = {}
    countries.forEach(c => {
      if (c.countryCode) {
        // Store by Alpha-2 code (what PostHog returns, e.g., "US")
        lookup[c.countryCode] = c
        // Also store by Alpha-3 code (what the map uses, e.g., "USA")
        const alpha3 = alpha2ToAlpha3[c.countryCode]
        if (alpha3) {
          lookup[alpha3] = c
        }
      }
    })
    return lookup
  }, [countries])

  // Get max views for color scaling
  const maxViews = useMemo(() => {
    return Math.max(...countries.map(c => c.views), 1)
  }, [countries])

  // Get cities for selected country
  const selectedCountryCities = useMemo(() => {
    if (!selectedCountry) return []
    return cities.filter(c => c.countryCode === selectedCountry.countryCode)
  }, [selectedCountry, cities])

  // Color scale function
  const getCountryColor = (countryCode: string) => {
    const data = countryLookup[countryCode]
    if (!data) return '#E5E5E5' // No data - light gray
    
    const intensity = Math.min(data.views / maxViews, 1)
    // Scale from light to dark primary color
    const lightness = 90 - (intensity * 50) // 90% to 40%
    return `hsl(30, 50%, ${lightness}%)`
  }

  const handleMouseMove = (e: React.MouseEvent, countryName: string, views: number | undefined) => {
    setTooltipContent(views ? `${countryName}: ${views.toLocaleString()} views` : countryName)
    setTooltipPosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setTooltipContent('')
  }

  return (
    <div className="relative">
      {/* Map container */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-500" />
            Visitor Map
          </h2>
          <p className="text-xs text-neutral-500">Click a country to see cities</p>
        </div>
        
        <div className="relative h-[400px] bg-neutral-50 dark:bg-neutral-950">
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
                  geographies.map((geo) => {
                    // Map topology uses ISO-3166-1 numeric codes as IDs and Alpha-3 in properties
                    const alpha3Code = geo.properties?.['ISO_A3'] || geo.properties?.['Alpha-3'] || ''
                    const countryCode = typeof alpha3Code === 'string' ? alpha3Code : ''
                    const rawName = geo.properties?.name || geo.properties?.NAME || ''
                    const countryName = typeof rawName === 'string' ? rawName : 'Unknown'
                    // Look up data using the Alpha-3 code from the map
                    const data = countryCode ? countryLookup[countryCode] : undefined
                    const hasData = !!data
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryCode ? getCountryColor(countryCode) : '#E5E5E5'}
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: 'none',
                            cursor: hasData ? 'pointer' : 'default',
                          },
                          hover: {
                            fill: hasData ? '#8B5A2B' : '#D4D4D4',
                            outline: 'none',
                          },
                          pressed: {
                            fill: '#6B4226',
                            outline: 'none',
                          },
                        }}
                        onMouseMove={(e) => handleMouseMove(e, countryName, data?.views)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => {
                          console.log('[v0] Map click - countryCode:', countryCode, 'countryName:', countryName, 'data:', data)
                          if (data) {
                            setSelectedCountry(data)
                          }
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {tooltipContent && (
            <div
              className="fixed z-50 px-2 py-1 bg-neutral-900 text-white text-xs rounded shadow-lg pointer-events-none"
              style={{
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y + 10,
              }}
            >
              {tooltipContent}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-neutral-200" />
              <span>No visits</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-12 h-3 rounded" style={{ background: 'linear-gradient(to right, hsl(30, 50%, 85%), hsl(30, 50%, 40%))' }} />
              <span>More visits</span>
            </div>
          </div>
          <span className="text-xs text-neutral-400">{countries.length} countries</span>
        </div>
      </div>

      {/* Country detail modal */}
      {selectedCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedCountry(null)}>
          <div 
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedCountry.country}
                </h3>
                <p className="text-sm text-neutral-500">
                  {selectedCountry.views.toLocaleString()} total views
                </p>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {selectedCountryCities.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Cities
                  </h4>
                  <ul className="space-y-2">
                    {selectedCountryCities.map((city, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {city.city}{city.state ? `, ${city.state}` : ''}
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {city.views.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No city-level data available for this country.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
