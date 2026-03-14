declare module 'react-simple-maps' {
  import { ComponentType, ReactNode } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: {
      rotate?: [number, number, number]
      scale?: number
      center?: [number, number]
    }
    width?: number
    height?: number
    style?: React.CSSProperties
    children?: ReactNode
  }

  export interface GeoData {
    id?: string | number | object
    rsmKey?: string
    properties?: {
      name?: string
      NAME?: string
      ISO_A2?: string
      'Alpha-3'?: string
      [key: string]: unknown
    }
    geometry?: object
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: GeoData[] }) => ReactNode
  }

  export interface GeographyProps {
    geography: GeoData
    style?: {
      default?: React.CSSProperties & { outline?: string; cursor?: string }
      hover?: React.CSSProperties & { outline?: string; cursor?: string }
      pressed?: React.CSSProperties & { outline?: string; cursor?: string }
    }
    onMouseEnter?: (event: React.MouseEvent) => void
    onMouseMove?: (event: React.MouseEvent) => void
    onMouseLeave?: (event: React.MouseEvent) => void
    onClick?: (event: React.MouseEvent) => void
    fill?: string
    stroke?: string
    strokeWidth?: number
    [key: string]: unknown
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    onMoveStart?: (event: { coordinates: [number, number]; zoom: number }) => void
    onMove?: (event: { coordinates: [number, number]; zoom: number; dragging: boolean }) => void
    onMoveEnd?: (event: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
  }

  export interface MarkerProps {
    coordinates: [number, number]
    onMouseEnter?: (event: React.MouseEvent) => void
    onMouseLeave?: (event: React.MouseEvent) => void
    onClick?: (event: React.MouseEvent) => void
    children?: ReactNode
    style?: React.CSSProperties
    [key: string]: unknown
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Marker: ComponentType<MarkerProps>
}
