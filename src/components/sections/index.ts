// Registry of available section component names.
// The actual dynamic imports live in PageRenderer.tsx to avoid
// Turbopack statically tracing server-only modules into the client bundle.

export const AVAILABLE_SECTIONS = [
  'Home1',
  'TextSection',
  'BlogGallery1',
  'NewsletterSignUp',
] as const

export type SectionName = typeof AVAILABLE_SECTIONS[number]

export function getAvailableSections(): string[] {
  return [...AVAILABLE_SECTIONS]
}
