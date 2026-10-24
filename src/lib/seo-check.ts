/**
 * SEO scoring: reads what's on a page or post, runs checks, and offers built-in suggestions.
 * Pure functions — no browser or server dependencies.
 */
import { effectiveTitle, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, type Seo } from '@/lib/seo'

export type PageContent = {
  headings: string[]
  text: string
  images: { src: string; alt: string }[]
  links: string[]
}

const decode = (v: string) => v.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, '’').replace(/&[a-z#0-9]+;/gi, ' ')
const clean = (v: string) => decode(v.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const attr = (tag: string, name: string) => decode(tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))?.slice(2).find((v) => v !== undefined) ?? '')

// Vercel Blob URLs used by this site
const isImageUrl = (v: string) => /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(v) || /blob\.vercel-storage\.com/i.test(v)
const isLink = (v: string) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(v.trim())
// Section field names used in The Adopted Son
const HEADING_KEYS = /^(heading|title|titleLine1|titleLine2|subheading|eyebrow|name)$/i
const SKIP_KEYS = /^(id|type|anchor|layout|width|align|style|color|colors|font|size|height|mode|variant|kind|code|embed|status|slug|newsletter|labels|buttonStyle|buttonUrl|ctaUrl|background_color|text_color|button_bg_color)$/i

function addHtml(html: string, out: PageContent) {
  for (const m of html.matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi)) out.headings.push(clean(m[1]))
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) out.images.push({ src: attr(m[0], 'src'), alt: attr(m[0], 'alt').trim() })
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) { const href = attr(m[0], 'href'); if (href) out.links.push(href) }
  const text = clean(html)
  if (text) out.text += ` ${text}`
}

function walk(value: unknown, key: string, out: PageContent, parent?: Record<string, unknown>) {
  if (typeof value === 'string') {
    const v = value.trim()
    if (!v || SKIP_KEYS.test(key)) return
    if (/<[a-z][\s\S]*>/i.test(v)) return addHtml(v, out)
    if (isImageUrl(v) && !/^(href|buttonUrl|ctaUrl)$/i.test(key)) {
      // Mirror the altKey convention in applyImageAlts (PageEditor) so the score reflects applied alts.
      const derivedAltKey = key.endsWith('_url') ? key.replace(/_url$/, '_alt')
        : (key === 'image' || key === 'src' || key === 'url') ? 'image_alt'
        : `${key}_alt`
      const alt = typeof parent?.alt === 'string' ? parent.alt
        : typeof parent?.imageAlt === 'string' ? parent.imageAlt
        : typeof parent?.[derivedAltKey] === 'string' ? (parent[derivedAltKey] as string)
        : ''
      out.images.push({ src: v, alt: alt.trim() })
      return
    }
    if (isLink(v)) { out.links.push(v); return }
    if (/^(alt|imageAlt)$/i.test(key)) return
    if (HEADING_KEYS.test(key)) out.headings.push(v)
    out.text += ` ${v}`
    return
  }
  if (Array.isArray(value)) { value.forEach((item) => walk(item, key, out, parent)); return }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const [k, v] of Object.entries(record)) walk(v, k, out, record)
  }
}

export function contentFromSections(sections: { data: unknown }[]): PageContent {
  const out: PageContent = { headings: [], text: '', images: [], links: [] }
  for (const section of sections) walk(section.data, '', out)
  out.text = out.text.replace(/\s+/g, ' ').trim()
  return out
}

export function contentFromHtml(html: string, extra: { images?: { src: string; alt: string }[] } = {}): PageContent {
  const out: PageContent = { headings: [], text: '', images: [...(extra.images ?? [])], links: [] }
  addHtml(html, out)
  out.text = out.text.replace(/\s+/g, ' ').trim()
  return out
}

/** Extracts PageContent from a ProseMirror JSON document (devotional content field). */
export function contentFromProseMirror(node: unknown): PageContent {
  const out: PageContent = { headings: [], text: '', images: [], links: [] }
  walkProseMirror(node, out)
  out.text = out.text.replace(/\s+/g, ' ').trim()
  return out
}

function walkProseMirror(node: unknown, out: PageContent) {
  if (!node || typeof node !== 'object') return
  const n = node as Record<string, unknown>
  const type = n.type as string | undefined
  const content = Array.isArray(n.content) ? n.content : []
  const text = typeof n.text === 'string' ? n.text : ''
  switch (type) {
    case 'heading': {
      const headingText = content.map((c: unknown) => {
        const cn = c as Record<string, unknown>
        return typeof cn.text === 'string' ? cn.text : ''
      }).join('')
      if (headingText.trim()) out.headings.push(headingText.trim())
      out.text += ` ${headingText}`
      return
    }
    case 'image': {
      const attrs = (n.attrs || {}) as Record<string, unknown>
      out.images.push({ src: String(attrs.src ?? ''), alt: String(attrs.alt ?? '').trim() })
      return
    }
    case 'text':
      out.text += ` ${text}`
      return
  }
  // Walk all marks for links
  if (Array.isArray(n.marks)) {
    for (const mark of n.marks) {
      const m = mark as Record<string, unknown>
      if (m.type === 'link') {
        const attrs = (m.attrs || {}) as Record<string, unknown>
        if (attrs.href) out.links.push(String(attrs.href))
      }
    }
  }
  for (const child of content) walkProseMirror(child, out)
}

export function withLibraryAlt(content: PageContent, altFor?: (src: string) => string | undefined): PageContent {
  if (!altFor) return content
  return { ...content, images: content.images.map((img) => (img.alt ? img : { ...img, alt: altFor(img.src)?.trim() ?? '' })) }
}

// ---------- Keyword scoring ----------

const STOPWORDS = new Set('a an and are as at be but by for from has have i in is it its me my of on or our so that the their them they this to us was we were what when which who will with you your yours'.split(' '))

const words = (text: string) => text.toLowerCase().replace(/[^a-z0-9''\s-]/g, ' ').split(/\s+/).filter(Boolean)

export function keywordIdeas(content: PageContent, title: string, limit = 5) {
  const counts = new Map<string, { count: number; forms: Map<string, number> }>()
  const add = (gram: string[], weight: number) => {
    const key = gram.map(stem).join(' ')
    const entry = counts.get(key) ?? { count: 0, forms: new Map() }
    const form = gram.join(' ')
    entry.count += weight
    entry.forms.set(form, (entry.forms.get(form) ?? 0) + 1)
    counts.set(key, entry)
  }
  const parts = [...Array(3).fill(title), ...content.headings, ...content.headings, content.text]
  for (const clause of parts.join('. ').split(/[.,;:!?|()\[\]"""“”—–]+/)) {
    const list = words(clause)
    for (let i = 0; i < list.length; i++) {
      const w = list[i]
      if (w.length > 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w)) add([w], 1)
      for (const n of [2, 3]) {
        const gram = list.slice(i, i + n)
        if (gram.length < n || gram.some((g) => STOPWORDS.has(g) || /^\d+$/.test(g) || g.length < 2)) continue
        add(gram, n === 2 ? 2.2 : 2.6)
      }
    }
  }
  const ranked = [...counts.entries()].filter(([key, entry]) => entry.count >= (key.includes(' ') ? 4 : 3)).sort((a, b) => b[1].count - a[1].count)
  const picked: typeof ranked = []
  for (const candidate of ranked) {
    const overlap = picked.findIndex(([key]) => key.includes(candidate[0]) || candidate[0].includes(key))
    if (overlap < 0) picked.push(candidate)
    else if (candidate[0].includes(picked[overlap][0]) && candidate[1].count >= picked[overlap][1].count / 2) picked[overlap] = candidate
  }
  return picked.slice(0, limit).map(([, entry]) => [...entry.forms.entries()].sort((a, b) => b[1] - a[1])[0][0])
}

export function suggestDescription(content: PageContent) {
  const text = content.text
  if (text.length < 40) return ''
  if (text.length <= 155) return text
  const cut = text.slice(0, 156)
  const sentence = cut.lastIndexOf('. ')
  if (sentence > 90) return cut.slice(0, sentence + 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '')}…`
}

export function suggestTitle(pageTitle: string, siteTitle: string, firstHeading = '') {
  const base = (pageTitle || firstHeading).trim()
  if (!base) return ''
  const full = `${base} — ${siteTitle}`
  return full.length <= SEO_TITLE_MAX ? full : base.slice(0, SEO_TITLE_MAX)
}

const stem = (word: string) => word.replace(/[''']s?$/, '').replace(/ies$/, 'y').replace(/([^s])s$/, '$1')
const stems = (text: string, skipStopwords = false) => words(text.replace(/[-_/]+/g, ' ')).filter((w) => !skipStopwords || !STOPWORDS.has(w)).map(stem)

export function usesKeyword(haystack: string, keyword: string) {
  const wanted = stems(keyword, true)
  if (!wanted.length) return Boolean(keyword.trim()) && haystack.toLowerCase().includes(keyword.trim().toLowerCase())
  const have = new Set(stems(haystack))
  return wanted.every((w) => have.has(w))
}

export function slugForKeyword(keyword: string) {
  const list = words(keyword.normalize('NFKD').replace(/[̀-ͯ]/g, '')).map((w) => w.replace(/[''']/g, '')).filter(Boolean)
  const meaningful = list.filter((w) => !STOPWORDS.has(w))
  return (meaningful.length ? meaningful : list).slice(0, 6).join('-').replace(/[^a-z0-9-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

// ---------- Checks ----------

export type CheckState = 'good' | 'ok' | 'bad'
export type SeoPatch = Partial<Seo> & { slug?: string }

export type SeoCheck = {
  id: string
  state: CheckState
  label: string
  fix?: { label: string; patch: SeoPatch }
}

export type SeoReport = { score: number; checks: SeoCheck[]; keywordIdeas: string[] }

export type ScoreInput = {
  seo: Seo
  noun: 'page' | 'post' | 'gallery'
  title: string
  path: string
  siteTitle: string
  siteDescription?: string
  siteUrl?: string
  fallbackDescription?: string
  shareImage?: string
  hideSite?: boolean
  content: PageContent
  slugEditable?: boolean
}

const has = usesKeyword

let lastText: { key: string; list: string[]; ideas: string[] } | null = null
function textStats(content: PageContent, title: string) {
  const key = `${title}\u0000${content.headings.join('\u0000')}\u0000${content.text}`
  if (lastText?.key !== key) lastText = { key, list: words(content.text), ideas: keywordIdeas(content, title) }
  return lastText
}

export function scoreSeo(input: ScoreInput): SeoReport {
  const { seo, content, noun } = input
  const checks: (SeoCheck & { weight: number; earned?: number })[] = []
  const add = (weight: number, check: SeoCheck, earned?: number) => checks.push({ ...check, weight, earned })
  const title = effectiveTitle(seo, input.title, input.siteTitle)
  const description = seo.description || input.fallbackDescription || ''
  const stats = textStats(content, input.title)
  const keyword = seo.keyword.trim()
  const ideas = stats.ideas
  const firstHeading = content.headings[0] ?? ''
  const slug = input.path.split('/').filter(Boolean).pop() ?? ''

  if (seo.noindex || input.hideSite)
    add(3, { id: 'index', state: 'bad', label: seo.noindex ? `This ${noun} is hidden from search engines (noindex).` : 'The whole site is hidden from search engines.', fix: seo.noindex ? { label: 'Let search engines list it', patch: { noindex: false } } : undefined })

  const suggestedTitle = suggestTitle(input.title, input.siteTitle, firstHeading)
  if (title.length < 30) add(2, { id: 'title', state: 'ok', label: `SEO title is short (${title.length} characters). 30–60 gives Google more to show.`, fix: suggestedTitle.length > title.length ? { label: `Use "${suggestedTitle}"`, patch: { title: suggestedTitle } } : undefined })
  else if (title.length > SEO_TITLE_MAX) add(2, { id: 'title', state: 'ok', label: `SEO title is ${title.length} characters, so Google may cut it off.`, fix: suggestedTitle && suggestedTitle.length <= SEO_TITLE_MAX && suggestedTitle !== title ? { label: `Use "${suggestedTitle}"`, patch: { title: suggestedTitle } } : undefined })
  else add(2, { id: 'title', state: 'good', label: 'SEO title is a good length.' })

  const suggestedDescription = suggestDescription(content)
  if (!description) add(3, { id: 'description', state: 'bad', label: 'Meta description is missing.', fix: suggestedDescription ? { label: 'Use the opening text', patch: { description: suggestedDescription } } : undefined })
  else if (description.length < 70) add(3, { id: 'description', state: 'ok', label: `Meta description is short (${description.length} characters). Aim for 70–160.`, fix: suggestedDescription.length > description.length ? { label: 'Use the opening text', patch: { description: suggestedDescription } } : undefined })
  else if (description.length > SEO_DESCRIPTION_MAX) add(3, { id: 'description', state: 'ok', label: `Meta description is ${description.length} characters and may be cut off.` })
  else add(3, { id: 'description', state: 'good', label: 'Meta description is a good length.' })

  if (!keyword) {
    add(4, { id: 'keyword', state: 'bad', label: ideas.length ? `No focus keyword yet. Your ${noun} talks most about "${ideas[0]}".` : 'No focus keyword yet.', fix: ideas[0] ? { label: `Use "${ideas[0]}"`, patch: { keyword: ideas[0] } } : undefined })
  } else {
    const intro = stats.list.slice(0, 120).join(' ')
    const spots = [
      { where: 'SEO title', found: has(title, keyword) },
      { where: 'meta description', found: has(description, keyword) },
      { where: 'URL', found: has(input.path, keyword) },
      { where: 'opening text', found: has(intro, keyword) || has(input.title, keyword) },
      { where: 'a heading', found: content.headings.some((h) => has(h, keyword)) || has(input.title, keyword) },
    ]
    const missing = spots.filter((s) => !s.found).map((s) => s.where)
    const keywordSlug = slugForKeyword(keyword)
    const slugFix = input.slugEditable && missing.includes('URL') && keywordSlug && keywordSlug !== slug
      ? { label: `Change the URL to /${keywordSlug}`, patch: { slug: keywordSlug } } : undefined
    add(4, {
      id: 'keyword',
      state: missing.length === 0 ? 'good' : missing.length <= 2 ? 'ok' : 'bad',
      label: missing.length === 0 ? `"${keyword}" appears in all 5 key spots.` : `"${keyword}" is in ${spots.length - missing.length}/5 spots. Missing from the ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`,
      fix: slugFix,
    }, (spots.length - missing.length) / spots.length)
  }

  if (noun !== 'gallery') {
    const minimum = minimumWords(noun)
    add(2, { id: 'length', state: stats.list.length >= minimum ? 'good' : stats.list.length >= minimum / 2 ? 'ok' : 'bad', label: stats.list.length >= minimum ? `${stats.list.length.toLocaleString()} words, enough for search engines.` : `Only ${stats.list.length.toLocaleString()} words. Aim for at least ${minimum}.` })
    if (stats.list.length >= 250) add(1, { id: 'headings', state: content.headings.length >= 2 ? 'good' : 'ok', label: content.headings.length >= 2 ? 'Headings break up the text.' : 'Add a few headings to break up the text.' })
  }

  const missingAlt = content.images.filter((img) => !img.alt)
  if (content.images.length) add(2, { id: 'alt', state: missingAlt.length === 0 ? 'good' : missingAlt.length < content.images.length ? 'ok' : 'bad', label: missingAlt.length === 0 ? 'Every image has alt text.' : `${missingAlt.length} of ${content.images.length} image${content.images.length === 1 ? '' : 's'} missing alt text.` })

  const host = (input.siteUrl ?? '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
  const internal = content.links.filter((link) => link.startsWith('/') || (host && link.toLowerCase().includes(host)))
  if (noun !== 'gallery') add(1, { id: 'links', state: internal.length ? 'good' : 'ok', label: internal.length ? `Links to ${internal.length === 1 ? 'another page' : `${internal.length} other pages`} on your site.` : 'Add at least one internal link.' })

  if (slug) {
    const messy = slug.split('-').length > 6 || /(^|-)(copy|draft|untitled|new|test)(-|$)|-\d+$/.test(slug)
    add(1, { id: 'url', state: messy ? 'ok' : 'good', label: messy ? `The address "/${slug}" is long or looks temporary.` : 'The address is short and readable.' })
  }

  add(1, { id: 'share', state: input.shareImage ? 'good' : 'ok', label: input.shareImage ? 'Has an image for social shares.' : 'No social share image.' })

  const total = checks.reduce((sum, c) => sum + c.weight, 0)
  const earned = checks.reduce((sum, c) => sum + c.weight * (c.earned ?? (c.state === 'good' ? 1 : c.state === 'ok' ? 0.5 : 0)), 0)
  let score = total ? Math.round((earned / total) * 100) : 0
  if (seo.noindex || input.hideSite) score = Math.min(score, 20)
  const order: Record<CheckState, number> = { bad: 0, ok: 1, good: 2 }
  return {
    score,
    checks: checks.sort((a, b) => order[a.state] - order[b.state]).map(({ weight: _w, earned: _e, ...check }) => check),
    keywordIdeas: ideas,
  }
}

export const minimumWords = (noun: ScoreInput['noun']) => (noun === 'post' ? 300 : noun === 'gallery' ? 0 : 150)
export const wordCount = (text: string) => words(text).length
export const scoreState = (score: number): CheckState => (score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad')
