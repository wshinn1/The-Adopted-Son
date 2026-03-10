import Image from 'next/image'
import DevotionalBody from './DevotionalBody'

interface Devotional {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: Record<string, unknown> | null
  cover_image_url?: string | null
  scripture_reference?: string | null
  scripture_text?: string | null
  category?: string | null
  read_time_minutes?: number | null
  published_at?: string | null
  is_premium?: boolean
  tags?: string[] | null
}

interface Props {
  devotional: Devotional
  canRead: boolean
}

export default function DevotionalContent({ devotional, canRead }: Props) {
  const publishedDate = devotional.published_at
    ? new Date(devotional.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <article>
      {/* Category + meta */}
      <div className="flex items-center gap-3 mb-4">
        {devotional.category && (
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
            {devotional.category}
          </span>
        )}
        {devotional.is_premium && (
          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
            Premium
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 text-balance leading-tight">
        {devotional.title}
      </h1>

      {/* Scripture reference */}
      {devotional.scripture_reference && (
        <p className="mt-3 text-primary-600 dark:text-primary-400 font-medium italic text-lg">
          {devotional.scripture_reference}
        </p>
      )}

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 text-sm text-neutral-400 dark:text-neutral-500">
        {publishedDate ? <span>{publishedDate}</span> : null}
        {devotional.read_time_minutes ? (
          <>
            <span>·</span>
            <span>{String(devotional.read_time_minutes)} min read</span>
          </>
        ) : null}
      </div>

      {/* Cover image */}
      {devotional.cover_image_url && (
        <div className="mt-8 relative aspect-[16/9] rounded-2xl overflow-hidden">
          <Image
            src={devotional.cover_image_url}
            alt={devotional.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Scripture text block */}
      {devotional.scripture_text && (
        <blockquote className="mt-8 border-l-4 border-primary-500 pl-5 py-2 bg-primary-50 dark:bg-primary-950/30 rounded-r-xl">
          <p className="text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
            {devotional.scripture_text}
          </p>
          {devotional.scripture_reference && (
            <cite className="mt-2 block text-sm font-semibold text-primary-600 dark:text-primary-400 not-italic">
              — {devotional.scripture_reference}
            </cite>
          )}
        </blockquote>
      )}

      {/* Excerpt */}
      {devotional.excerpt && (
        <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium text-pretty">
          {devotional.excerpt}
        </p>
      )}

      {/* Body content — only shown when user has access */}
      {canRead && devotional.content && (
        <div className="mt-8">
          <DevotionalBody content={devotional.content} />
        </div>
      )}

      {/* Tags */}
      {canRead && devotional.tags && devotional.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {devotional.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
