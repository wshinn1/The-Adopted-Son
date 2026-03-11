import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Registry of all available section components
// Add new sections here as they are created
export const sectionComponents: Record<string, ComponentType<{ data: any }>> = {
  Home1: dynamic(() => import('./Home1')),
  TextSection: dynamic(() => import('./TextSection')),
}

// Get a section component by name
export function getSectionComponent(componentName: string): ComponentType<{ data: any }> | null {
  return sectionComponents[componentName] || null
}

// List all available section names
export function getAvailableSections(): string[] {
  return Object.keys(sectionComponents)
}
