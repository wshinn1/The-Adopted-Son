/** Search and social settings for a page or post. */
export type Seo = {
  title: string
  description: string
  canonical: string
  noindex: boolean
  nofollow: boolean
  ogTitle: string
  ogDescription: string
  ogImage: string
  keyword: string
}

export const emptySeo: Seo = {
  title: '', description: '', canonical: '', noindex: false, nofollow: false,
  ogTitle: '', ogDescription: '', ogImage: '', keyword: '',
}

export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160

export function normalizeSeo(value: unknown): Seo {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const str = (key: keyof Seo) => (typeof v[key] === 'string' ? (v[key] as string) : '')
  return {
    title: str('title'), description: str('description'), canonical: str('canonical'),
    noindex: v.noindex === true, nofollow: v.nofollow === true,
    ogTitle: str('ogTitle'), ogDescription: str('ogDescription'), ogImage: str('ogImage'), keyword: str('keyword'),
  }
}

export function cleanSeo(input: unknown): Seo {
  const seo = normalizeSeo(input)
  return {
    title: seo.title.trim().slice(0, 200),
    description: seo.description.trim().slice(0, 400),
    canonical: seo.canonical.trim(),
    noindex: seo.noindex,
    nofollow: seo.nofollow,
    ogTitle: seo.ogTitle.trim().slice(0, 200),
    ogDescription: seo.ogDescription.trim().slice(0, 400),
    ogImage: seo.ogImage.trim(),
    keyword: seo.keyword.trim().slice(0, 100),
  }
}

export function effectiveTitle(seo: Seo, pageTitle: string, siteTitle: string) {
  return seo.title.trim() || (pageTitle.trim() ? `${pageTitle.trim()} — ${siteTitle}` : siteTitle)
}

export function plainText(html: string, max = SEO_DESCRIPTION_MAX) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
