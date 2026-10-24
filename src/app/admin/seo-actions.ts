'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { deleteSeoSuggestions, getSeoSuggestions, saveSeoSuggestions } from '@/lib/seo-db'
import { isSeoSectionType, seoSectionTypes, type SeoDraft } from '@/lib/seo-sections'
import { slugify } from '@/lib/seo'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
}

export type SeoSuggestions = {
  titles: string[]
  descriptions: string[]
  keyword: string
  keywordReason: string
  relatedKeywords: string[]
  imageAlts: { src: string; alt: string }[]
  advice: string[]
  slug: string
  heading: string
  openingSentence: string
  buildOut: SeoDraft[]
}

export type SavedSeoSuggestions = SeoSuggestions & { savedAt: string }

export type SeoSuggestInput = {
  noun: 'page' | 'post' | 'gallery'
  title: string
  path: string
  siteTitle: string
  keyword: string
  seoTitle: string
  description: string
  headings: string[]
  text: string
  images: { src: string; alt: string }[]
  slugEditable?: boolean
  siteDescription?: string
  wordCount?: number
  targetWords?: number
  saveKey?: string
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const MODEL = 'claude-opus-5-5'

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['titles', 'descriptions', 'keyword', 'keywordReason', 'relatedKeywords', 'slug', 'heading', 'openingSentence', 'buildOut', 'imageAlts', 'advice'],
  properties: {
    titles: { type: 'array', items: { type: 'string' }, description: 'Three SEO title options, each 30–60 characters.' },
    descriptions: { type: 'array', items: { type: 'string' }, description: 'Two meta description options, each 120–155 characters.' },
    keyword: { type: 'string', description: 'The single best focus keyword: a 2–4 word phrase a real person would type into Google to find this page.' },
    keywordReason: { type: 'string', description: 'One plain sentence on why this keyword fits.' },
    relatedKeywords: { type: 'array', items: { type: 'string' }, description: 'Up to four other strong keyword candidates (2–4 words each), best first.' },
    slug: { type: 'string', description: 'A short URL slug built around the focus keyword. Empty when the address can\'t be changed.' },
    heading: { type: 'string', description: 'A heading (under 70 characters) that contains the focus keyword.' },
    openingSentence: { type: 'string', description: 'One natural sentence that could open the first paragraph and contains the focus keyword.' },
    buildOut: {
      type: 'array',
      description: 'Only when the page is shorter than its target: 2–4 drafted sections. Empty array when long enough.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['type', 'reason', 'eyebrow', 'heading', 'text', 'buttonLabel', 'cards'],
        properties: {
          type: { type: 'string', enum: seoSectionTypes.map((item) => item.type) },
          reason: { type: 'string' },
          eyebrow: { type: 'string' },
          heading: { type: 'string' },
          text: { type: 'string' },
          buttonLabel: { type: 'string' },
          cards: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'description', 'features'], properties: { title: { type: 'string' }, description: { type: 'string' }, features: { type: 'string' } } } },
        },
      },
    },
    imageAlts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['src', 'alt'], properties: { src: { type: 'string' }, alt: { type: 'string' } } } },
    advice: { type: 'array', items: { type: 'string' }, description: 'Up to four specific, practical content improvements.' },
  },
} as const

const SYSTEM = `You are an SEO editor helping a devotional blog author improve one of their posts. They write Christian devotional content aimed at helping readers grow in faith.

Base every suggestion on the page content you are given: use its real subject, wording and audience, and never invent claims the post doesn't make. Titles and descriptions should read naturally and make a reader want to click. Keep the author's voice.

Choosing the focus keyword:
- Pick the phrase a real person would type into Google to find this post, 2–4 words.
- Be specific: the post's main spiritual theme, scripture, or topic.
- Prefer words the post already uses.
- If a keyword is already set and it's a good fit, keep it.

Work as one plan around the focus keyword. Every title, description, slug, heading and opening sentence must contain that keyword's words in a natural order. The heading and opening sentence must be true to what the post already says.

For alt text, describe what the image most likely shows given context, in under 125 characters, without starting with "Image of".

When the post is shorter than its target word count, draft new sections for buildOut — always use type 'text' for blog posts.`

const list = (value: unknown, max: number, length = 300) =>
  (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, length)).filter(Boolean).slice(0, max) : [])

export async function suggestSeoAction(input: SeoSuggestInput): Promise<Result<SavedSeoSuggestions>> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Your session expired. Sign in again.' }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'AI suggestions need an Anthropic API key. Add ANTHROPIC_API_KEY in your Vercel project\'s Environment Variables, then redeploy.' }
  }

  const text = String(input.text ?? '').slice(0, 24000)
  if (!text.trim() && !String(input.title ?? '').trim()) {
    return { ok: false, error: `Give this ${input.noun} a title or a few words first.` }
  }

  const count = Math.max(0, Math.round(Number(input.wordCount) || 0))
  const target = Math.max(0, Math.round(Number(input.targetWords) || 0))
  const images = (Array.isArray(input.images) ? input.images : []).slice(0, 20).map((img) => ({
    src: String(img?.src ?? '').slice(0, 500),
    alt: String(img?.alt ?? '').slice(0, 300),
  }))
  const missingAlt = images.filter((img) => img.src && !img.alt.trim())

  const brief = [
    `Site: ${String(input.siteTitle ?? '').slice(0, 100)}`,
    `This is a ${input.noun} at the address ${String(input.path ?? '').slice(0, 200)}.`,
    `Title: ${String(input.title ?? '').slice(0, 200) || '(none)'}`,
    `Current SEO title: ${String(input.seoTitle ?? '').slice(0, 200) || '(none)'}`,
    `Current meta description: ${String(input.description ?? '').slice(0, 400) || '(none)'}`,
    `Focus keyword: ${String(input.keyword ?? '').slice(0, 100) || '(none chosen yet)'}`,
    input.slugEditable ? 'The address can be changed.' : 'The address can\'t be changed, so return an empty slug.',
    `Headings: ${list(input.headings, 40, 200).join(' | ') || '(none)'}`,
    `Site description: ${String(input.siteDescription ?? '').slice(0, 400) || '(none)'}`,
    target && count < target
      ? `Length: ${count} words, short of the ${target} this ${input.noun} should have, so draft about ${target - count} more words for buildOut.`
      : `Length: ${count} words, long enough, so return an empty buildOut.`,
    'This is a blog post, so give every buildOut section the type text.',
    `Images missing alt text: ${missingAlt.length ? missingAlt.map((img) => img.src).join('\n') : '(none)'}`,
    '',
    '<page_text>',
    text,
    '</page_text>',
  ].join('\n')

  try {
    const client = new Anthropic()
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } } as any,
      system: SYSTEM,
      messages: [{ role: 'user', content: brief }],
    })

    if (response.stop_reason === 'refusal') return { ok: false, error: 'The AI declined to review this page. Try again.' }
    if (response.stop_reason === 'max_tokens') return { ok: false, error: 'The AI ran out of room. Try again.' }

    const raw = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
    const parsed = JSON.parse(raw) as Partial<SeoSuggestions>
    const wanted = new Set(missingAlt.map((img) => img.src))

    const data: SeoSuggestions = {
      titles: list(parsed.titles, 3, 120),
      descriptions: list(parsed.descriptions, 3, 320),
      keyword: typeof parsed.keyword === 'string' ? parsed.keyword.trim().slice(0, 100) : '',
      keywordReason: typeof parsed.keywordReason === 'string' ? parsed.keywordReason.trim().slice(0, 300) : '',
      relatedKeywords: list(parsed.relatedKeywords, 4, 100),
      imageAlts: (Array.isArray(parsed.imageAlts) ? parsed.imageAlts : [])
        .filter((item) => item && wanted.has(item.src) && typeof item.alt === 'string')
        .map((item) => ({ src: item.src, alt: item.alt.trim().slice(0, 200) })),
      advice: list(parsed.advice, 4, 400),
      slug: input.slugEditable ? slugify(typeof parsed.slug === 'string' ? parsed.slug : '') : '',
      heading: typeof parsed.heading === 'string' ? parsed.heading.trim().slice(0, 120) : '',
      openingSentence: typeof parsed.openingSentence === 'string' ? parsed.openingSentence.trim().slice(0, 400) : '',
      buildOut: target && count < target && Array.isArray(parsed.buildOut)
        ? parsed.buildOut
            .filter((item) => item && typeof item.heading === 'string' && typeof item.text === 'string')
            .slice(0, 4)
            .map((item): SeoDraft => ({
              type: isSeoSectionType(item.type) ? item.type : 'text',
              reason: typeof item.reason === 'string' ? item.reason.trim().slice(0, 300) : '',
              eyebrow: typeof item.eyebrow === 'string' ? item.eyebrow.trim().slice(0, 60) : '',
              heading: item.heading.trim().slice(0, 120),
              text: item.text.trim().slice(0, 3000),
              buttonLabel: typeof item.buttonLabel === 'string' ? item.buttonLabel.trim().slice(0, 40) : '',
              cards: [],
            }))
            .filter((item) => item.text)
        : [],
    }

    const savedAt = new Date().toISOString()
    if (input.saveKey) {
      await saveSeoSuggestions(input.saveKey, data).catch((err) => console.error('Saving SEO suggestions failed', err))
    }
    return { ok: true, data: { ...data, savedAt } }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, error: 'Anthropic didn\'t accept the API key. Check ANTHROPIC_API_KEY in Vercel.' }
    if (error instanceof Anthropic.PermissionDeniedError) return { ok: false, error: 'Your Anthropic account can\'t use this model yet.' }
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: 'Too many AI requests right now. Wait a minute and try again.' }
    if (error instanceof Anthropic.APIError) {
      console.error('SEO suggestions failed', error.status, error.message)
      return { ok: false, error: `The AI service returned an error (${error.status ?? 'no status'}).` }
    }
    if (error instanceof SyntaxError) return { ok: false, error: 'The AI\'s answer came back garbled. Try again.' }
    console.error('SEO suggestions failed', error)
    return { ok: false, error: 'Couldn\'t reach the AI service. Check your connection and try again.' }
  }
}

const clip = (value: unknown, length: number) => (typeof value === 'string' ? value.slice(0, length) : '')

export async function loadSeoSuggestionsAction(key: string): Promise<SavedSeoSuggestions | null> {
  try { await requireAdmin() } catch { return null }
  if (!key) return null
  const saved = await getSeoSuggestions(key)
  if (!saved || !saved.data || typeof saved.data !== 'object') return null
  const data = saved.data as Record<string, unknown>
  return {
    titles: list(data.titles, 3, 120),
    descriptions: list(data.descriptions, 3, 320),
    keyword: clip(data.keyword, 100),
    keywordReason: clip(data.keywordReason, 300),
    relatedKeywords: list(data.relatedKeywords, 4, 100),
    imageAlts: (Array.isArray(data.imageAlts) ? data.imageAlts : []).filter((item) => item && typeof item === 'object') as { src: string; alt: string }[],
    advice: list(data.advice, 4, 400),
    slug: clip(data.slug, 120),
    heading: clip(data.heading, 120),
    openingSentence: clip(data.openingSentence, 400),
    buildOut: (Array.isArray(data.buildOut) ? data.buildOut : []).filter((item) => item && typeof item === 'object') as SeoSuggestions['buildOut'],
    savedAt: saved.savedAt,
  }
}

export async function keepSeoSuggestionsAction(key: string, suggestions: SeoSuggestions): Promise<void> {
  try { await requireAdmin() } catch { return }
  if (!key) return
  await saveSeoSuggestions(key, suggestions)
}

export async function clearSeoSuggestionsAction(key: string): Promise<void> {
  try { await requireAdmin() } catch { return }
  if (key) await deleteSeoSuggestions(key)
}
