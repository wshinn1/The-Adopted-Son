'use client'

import { useEffect, useState } from 'react'
import { SeoScore, type SeoScoreProps } from '@/components/admin/SeoScore'
import type { PageContent } from '@/lib/seo-check'
import { effectiveTitle, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, type Seo } from '@/lib/seo'

export interface SeoSettings {
  siteTitle: string
  siteUrl?: string
  seoDescription?: string
  ogImageUrl?: string
  hideFromSearch?: boolean
}

type Props = {
  seo: Seo
  onChange: (patch: Partial<Seo>) => void
  noun: 'page' | 'post' | 'gallery'
  title: string
  path: string
  settings: SeoSettings
  fallbackDescription?: string
  fallbackImage?: string
  content?: PageContent
  onSlugChange?: (slug: string) => void
  /** For devotionals: appends drafted HTML to the post content. */
  addToHtml?: (html: string) => void
  seoKey?: string
}

function Counter({ length, max, min = 0 }: { length: number; max: number; min?: number }) {
  const state = length === 0 ? '' : length > max ? 'over' : length < min ? 'short' : 'good'
  return (
    <span className={`seo-counter ${state}`}>
      {length}/{max}{state === 'over' ? ' — may be cut off' : state === 'short' ? ' — a little short' : ''}
    </span>
  )
}

function Field({ label, value, onChange, placeholder, hint, multiline }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: React.ReactNode; multiline?: boolean
}) {
  return (
    <div className="seo-field-group">
      <label>
        <span className="seo-field-label">{label}</span>
        {multiline
          ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
          : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        }
      </label>
      {hint && <p className="seo-hint">{hint}</p>}
    </div>
  )
}

function SharePreview({ host, title, description, image }: { host: string; title: string; description: string; image: string }) {
  return (
    <div className="share-preview" aria-label="Social share preview">
      <span className="serp-label">Share preview</span>
      <div className="share-card">
        {image
          ? <img src={image} alt="" />
          : <div className="share-card-empty">No image — add a cover or social image so shares show a picture.</div>}
        <div className="share-card-text">
          <span>{host.toUpperCase()}</span>
          <strong>{title.length > 90 ? `${title.slice(0, 89)}…` : title}</strong>
          {description && <p>{description.length > 150 ? `${description.slice(0, 149)}…` : description}</p>}
        </div>
      </div>
    </div>
  )
}

export function SeoPanel({ seo, onChange, noun, title, path, settings, fallbackDescription = '', fallbackImage = '', content, onSlugChange, addToHtml, seoKey }: Props) {
  const shownTitle = effectiveTitle(seo, title, settings.siteTitle)
  const shareTitle = seo.ogTitle || seo.title || title || settings.siteTitle
  const shownDescription = seo.description || fallbackDescription || settings.seoDescription || ''
  const [currentHost, setCurrentHost] = useState('')
  useEffect(() => setCurrentHost(window.location.host), [])
  const host = (settings.siteUrl || currentHost || 'theadoptedson.com').replace(/^https?:\/\//, '')
  const breadcrumb = [host, ...path.split('/').filter(Boolean)].join(' › ')

  const scoreInput = content ? {
    seo, noun, title, path,
    siteTitle: settings.siteTitle,
    siteDescription: settings.seoDescription,
    siteUrl: settings.siteUrl,
    fallbackDescription,
    shareImage: seo.ogImage || fallbackImage || settings.ogImageUrl,
    hideSite: settings.hideFromSearch,
    content,
    slugEditable: Boolean(onSlugChange),
  } : null

  const handleScoreChange: SeoScoreProps['onChange'] = ({ slug, ...patch }) => {
    if (slug && onSlugChange) onSlugChange(slug)
    if (Object.keys(patch).length) onChange(patch)
  }

  return (
    <div className="seo-panel">
      <h3 className="seo-panel-title">SEO &amp; sharing</h3>

      {scoreInput && (
        <SeoScore
          input={scoreInput}
          onChange={handleScoreChange}
          addToHtml={addToHtml}
          saveKey={seoKey}
        />
      )}

      <div className="serp-preview" aria-label="Google search preview">
        <span className="serp-label">Google preview</span>
        <span className="serp-url">{breadcrumb}</span>
        <span className="serp-title">{shownTitle.length > 65 ? `${shownTitle.slice(0, 64)}…` : shownTitle}</span>
        <span className="serp-description">{shownDescription ? (shownDescription.length > 160 ? `${shownDescription.slice(0, 159)}…` : shownDescription) : 'Add a meta description so search engines show a useful summary.'}</span>
        {(seo.noindex || settings.hideFromSearch) && <span className="serp-hidden">Hidden from search engines</span>}
      </div>

      <Field
        label="SEO title"
        value={seo.title}
        onChange={(value) => onChange({ title: value })}
        placeholder={effectiveTitle({ ...seo, title: '' }, title, settings.siteTitle)}
        hint={<><Counter length={shownTitle.length} max={SEO_TITLE_MAX} min={30} /> · Shown in search results. Leave empty to use &ldquo;{effectiveTitle({ ...seo, title: '' }, title, settings.siteTitle)}&rdquo;.</>}
      />
      <Field
        label="Meta description"
        value={seo.description}
        onChange={(value) => onChange({ description: value })}
        multiline
        placeholder={fallbackDescription || settings.seoDescription || 'Describe this post for search results…'}
        hint={<><Counter length={seo.description.length} max={SEO_DESCRIPTION_MAX} min={70} /> · The summary under the title in search results.{fallbackDescription && !seo.description ? ' Leave empty to use the excerpt.' : ''}</>}
      />

      <details className="seo-group">
        <summary>Social sharing</summary>
        <p className="seo-hint">Shown when this {noun} is shared on Facebook, LinkedIn, or X. Leave empty to reuse the SEO title and description.</p>
        <Field
          label="Social title"
          value={seo.ogTitle}
          onChange={(value) => onChange({ ogTitle: value })}
          placeholder={seo.title || title || settings.siteTitle}
        />
        <Field
          label="Social description"
          value={seo.ogDescription}
          onChange={(value) => onChange({ ogDescription: value })}
          multiline
          placeholder={shownDescription}
        />
        <Field
          label="Social image URL"
          value={seo.ogImage}
          onChange={(value) => onChange({ ogImage: value })}
          placeholder={fallbackImage || settings.ogImageUrl || 'https://…'}
          hint="A JPG or PNG, 1200 × 630 works best. Leave empty to use the cover image."
        />
        <SharePreview
          host={host}
          title={shareTitle}
          description={seo.ogDescription || shownDescription}
          image={seo.ogImage || fallbackImage || settings.ogImageUrl || ''}
        />
      </details>

      <details className="seo-group" open={Boolean(seo.canonical || seo.noindex || seo.nofollow)}>
        <summary>Advanced</summary>
        <label className="seo-checkbox">
          <input type="checkbox" checked={seo.noindex} onChange={(e) => onChange({ noindex: e.target.checked })} />
          <span>Hide this {noun} from search engines (noindex)</span>
        </label>
        <label className="seo-checkbox">
          <input type="checkbox" checked={seo.nofollow} onChange={(e) => onChange({ nofollow: e.target.checked })} />
          <span>Ask search engines not to follow links on this {noun} (nofollow)</span>
        </label>
        <Field
          label="Canonical URL"
          value={seo.canonical}
          onChange={(value) => onChange({ canonical: value })}
          placeholder={`${settings.siteUrl || ''}${path}`}
          hint="Only needed if this content also lives at another address."
        />
      </details>
    </div>
  )
}
