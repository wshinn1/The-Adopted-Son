import Link from 'next/link'
import Image from 'next/image'

interface Devotional {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  cover_image_url?: string | null
  scripture_reference?: string | null
  category?: string | null
  read_time_minutes?: number | null
  published_at?: string | null
  is_premium?: boolean
  tags?: string[] | null
}

interface Props {
  devotionals: Devotional[]
}

export default function DevotionalGrid({ devotionals }: Props) {
  if (devotionals.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400">
        No devotionals published yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {devotionals.map((d) => (
        <DevotionalCard key={d.id} devotional={d} />
      ))}
    </div>
  )
}

function DevotionalCard({ devotional: d }: { devotional: Devotional }) {
  const publishedDate = d.published_at
    ? new Date(d.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Link
      href={`/devotionals/${d.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:shadow-lg transition-shadow bg-white dark:bg-neutral-900"
    >
      <div className="relative aspect-[16/9] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {d.cover_image_url ? (
          <Image
            src={d.cover_image_url}
            alt={d.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl text-neutral-300 dark:text-neutral-600">✝</span>
          </div>
        )}
        {d.is_premium && (
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
            Premium
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        {d.category && (
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-2">
            {d.category}
          </span>
        )}
        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-balance">
          {d.title}
        </h3>
        {d.scripture_reference && (
          <p className="mt-1.5 text-sm text-primary-600 dark:text-primary-400 italic font-medium">
            {d.scripture_reference}
          </p>
        )}
        {d.excerpt && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {d.excerpt}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
          {publishedDate && <span>{publishedDate}</span>}
          {d.read_time_minutes && (
            <>
              <span>·</span>
              <span>{d.read_time_minutes} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
