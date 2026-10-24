/**
 * Section types the SEO tool may draft copy into.
 * For devotionals (blog posts) the addTo target is { kind: 'html' }, so only the 'text' type
 * is used in practice — the AI always gets type 'text' for posts.
 */

export const seoSectionTypes = [
  { type: 'text', fits: 'Plain reading: a heading and paragraphs. The default for blog posts.' },
] as const

export type SeoSectionType = (typeof seoSectionTypes)[number]['type']

export type SeoDraft = {
  type: SeoSectionType
  reason: string
  eyebrow: string
  heading: string
  text: string
  buttonLabel: string
  cards: { title: string; description: string; features: string }[]
}

export const isSeoSectionType = (value: unknown): value is SeoSectionType => seoSectionTypes.some((item) => item.type === value)

export function toSeoDraft(value: Partial<SeoDraft>): SeoDraft {
  return {
    type: isSeoSectionType(value.type) ? value.type : 'text',
    reason: value.reason ?? '',
    eyebrow: value.eyebrow ?? '',
    heading: value.heading ?? '',
    text: value.text ?? '',
    buttonLabel: value.buttonLabel ?? '',
    cards: Array.isArray(value.cards) ? value.cards : [],
  }
}

const escape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const paragraphs = (text: string) => text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)

export function seoDraftHtml(draft: SeoDraft) {
  const html = paragraphs(draft.text).map((p) => `<p>${escape(p)}</p>`).join('')
  return `${draft.heading ? `<h2>${escape(draft.heading)}</h2>` : ''}${html}`
}

export function seoDraftText(draft: SeoDraft) {
  return [draft.heading, draft.text].filter(Boolean).join('\n\n')
}
