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
  published_at?: string | null
  is_premium?: boolean
}

interface Props {
  featured: Devotional | null
}

export default function DevotionalHero({ featured }: Props) {
  if (!featured) {
    return (
      <section className="bg-neutral-50 dark:bg-neutral-900 py-20 lg:py-32">
        <div className="container text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 text-balance">
            Daily Devotionals for the Adopted Son
          </h1>
          <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto text-pretty">
            Fresh reflections rooted in Scripture, written to draw you closer to your Father.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/devotionals"
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Browse devotionals
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative bg-neutral-900 text-white overflow-hidden min-h-[480px] flex items-center">
      {featured.cover_image_url && (
        <Image
          src={featured.cover_image_url}
          alt={featured.title}
          fill
          className="object-cover opacity-30"
          priority
        />
      )}
      <div className="relative container py-20 lg:py-32 max-w-3xl">
        {featured.category && (
          <span className="inline-block px-3 py-1 rounded-full bg-primary-600 text-xs font-semibold uppercase tracking-wide mb-4">
            {featured.category}
          </span>
        )}
        <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-balance">
          {featured.title}
        </h1>
        {featured.scripture_reference && (
          <p className="mt-3 text-primary-300 font-medium italic">
            {featured.scripture_reference}
          </p>
        )}
        {featured.excerpt && (
          <p className="mt-4 text-neutral-300 text-lg leading-relaxed text-pretty line-clamp-3">
            {featured.excerpt}
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/devotionals/${featured.slug}`}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors w-fit"
          >
            Read today's devotional
          </Link>
          <Link
            href="/devotionals"
            className="px-6 py-3 border border-white/30 font-medium rounded-xl hover:bg-white/10 transition-colors w-fit"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  )
}
