import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Registry of all available section components
// Add new sections here as they are created
// Using ssr: false to prevent HMR issues with dynamic imports
export const sectionComponents: Record<string, ComponentType<{ data: any }>> = {
  Home1: dynamic(() => import('./Home1'), { ssr: false }),
  TextSection: dynamic(() => import('./TextSection'), { ssr: false }),
  BlogGallery1: dynamic(() => import('./BlogGallery1')),
  NewsletterSignUp: dynamic(() => import('./NewsletterSignUp'), { ssr: false }),
}

// Get a section component by name
export function getSectionComponent(componentName: string): ComponentType<{ data: any }> | null {
  return sectionComponents[componentName] || null
}

// List all available section names
export function getAvailableSections(): string[] {
  return Object.keys(sectionComponents)
}
