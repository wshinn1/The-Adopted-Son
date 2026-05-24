import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface BlogGallery1Data {
  heading?: string
  subheading?: string
  post_count?: number
  background_color?: string
  show_featured_banner?: boolean
  _devotionals?: Devotional[]
}

interface Devotional {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
}

interface BlogGallery1Props {
  data: BlogGallery1Data
}

const FONT_FAMILY_MAP: Record<string, string> = {
  Be_Vietnam_Pro: "'Be Vietnam Pro', sans-serif",
  'system-ui': 'system-ui, sans-serif',
  Inter: "'Inter', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Open_Sans: "'Open Sans', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Lato: "'Lato', sans-serif",
  Nunito: "'Nunito', sans-serif",
  Raleway: "'Raleway', sans-serif",
  Work_Sans: "'Work Sans', sans-serif",
  DM_Sans: "'DM Sans', sans-serif",
  Outfit: "'Outfit', sans-serif",
  Playfair_Display: "'Playfair Display', serif",
  Merriweather: "'Merriweather', serif",
  Lora: "'Lora', serif",
  Source_Serif_4: "'Source Serif 4', serif",
  Crimson_Text: "'Crimson Text', serif",
  EB_Garamond: "'EB Garamond', serif",
  Libre_Baskerville: "'Libre Baskerville', serif",
  Cormorant_Garamond: "'Cormorant Garamond', serif",
  Bitter: "'Bitter', serif",
  Spectral: "'Spectral', serif",
  JetBrains_Mono: "'JetBrains Mono', monospace",
  Fira_Code: "'Fira Code', monospace",
  Source_Code_Pro: "'Source Code Pro', monospace",
  IBM_Plex_Mono: "'IBM Plex Mono', monospace",
  Space_Mono: "'Space Mono', monospace",
  Roboto_Mono: "'Roboto Mono', monospace",
  Courier_Prime: "'Courier Prime', monospace",
  Anonymous_Pro: "'Anonymous Pro', monospace",
}

export default async function BlogGallery1({ data }: BlogGallery1Props) {
  const count = data.post_count || 3
  const showBanner = data.show_featured_banner !== false
  const fetchLimit = showBanner ? count + 1 : count

  const [{ data: rows }, { data: typographyRow }] = await Promise.all([
    supabaseAdmin
      .from('devotionals')
      .select('id, title, slug, excerpt, cover_image_url, published_at, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(fetchLimit),
    supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'typography')
      .single(),
  ])

  const devotionals: Devotional[] = rows ?? []
  const typo = typographyRow?.value
    ? (typeof typographyRow.value === 'string' ? JSON.parse(typographyRow.value) : typographyRow.value)
    : {}

  const excerptCardStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY_MAP[typo.excerpt_font] || "'Merriweather', serif",
    fontSize: typo.excerpt_size ? `${typo.excerpt_size}pt` : '12pt',
    fontWeight: typo.excerpt_weight || '400',
    fontStyle: typo.excerpt_style || 'normal',
    color: typo.excerpt_color || '#6b7280',
  }

  const excerptFeaturedStyle: React.CSSProperties = {
    ...excerptCardStyle,
    color: typo.excerpt_featured_color || 'rgba(255,255,255,0.75)',
  }

  // Resolved heading style — avoids CSS variable dependency in this Server Component
  const headingBaseStyle = {
    fontFamily: FONT_FAMILY_MAP[typo.heading_font] || "'Be Vietnam Pro', sans-serif",
    fontSize: typo.heading_size ? `${typo.heading_size}pt` : '28pt',
    fontWeight: typo.heading_weight || '700',
    fontStyle: typo.heading_style || 'normal',
    lineHeight: '1.3',
  }
  const headingCardStyle: React.CSSProperties = { ...headingBaseStyle, color: '#111827' }
  const headingFeaturedStyle: React.CSSProperties = {
    ...headingBaseStyle,
    color: '#ffffff',
    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
  }

  const featured = showBanner && devotionals.length > count ? devotionals[0] : null
  const grid = featured ? devotionals.slice(1, count + 1) : devotionals.slice(0, count)

  if (devotionals.length === 0) {
    return (
      <section
        className="w-full py-16 px-6 md:px-12 lg:px-24"
        style={{ backgroundColor: data.background_color || '#ffffff' }}
      >
        {(data.heading || data.subheading) && (
          <div className="mb-10 text-center">
            {data.heading && (
              <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-2">{data.heading}</h2>
            )}
            {data.subheading && (
              <p className="text-neutral-500 font-body text-base max-w-xl mx-auto">{data.subheading}</p>
            )}
          </div>
        )}
        <p className="text-center text-neutral-400 text-sm">No devotionals published yet.</p>
      </section>
    )
  }

  return (
    <section
      className="w-full py-16 px-6 md:px-12 lg:px-24"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      {(data.heading || data.subheading) && (
        <div className="mb-10 text-center">
          {data.heading && (
            <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-2">{data.heading}</h2>
          )}
          {data.subheading && (
            <p className="text-neutral-500 font-body text-base max-w-xl mx-auto">{data.subheading}</p>
          )}
        </div>
      )}

      {/* Featured banner — card layout on mobile, overlay on md+ */}
      {featured && showBanner && (
        <Link href={`/devotionals/${featured.slug}`} className="group block mb-8 rounded-2xl overflow-hidden">
          {/* Image — full on desktop (aspect-[3/1]), taller on mobile */}
          <div className="relative w-full aspect-[4/3] md:aspect-[3/1] md:min-h-[200px]">
            {featured.cover_image_url ? (
              <Image
                src={featured.cover_image_url}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-neutral-800" />
            )}
            {/* Overlay + text — desktop only */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="hidden md:flex absolute inset-0 flex-col justify-center px-8 md:px-12 max-w-2xl">
              {featured.category && (
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-3 w-fit"
                  style={{ backgroundColor: 'var(--color-category-badge-bg)', color: 'var(--color-category-badge-text)' }}
                >
                  {featured.category}
                </span>
              )}
              <h3 className="mb-3" style={headingFeaturedStyle}>
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p className="leading-relaxed mb-4" style={excerptFeaturedStyle}>
                  {featured.excerpt}
                </p>
              )}
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-2 w-fit hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--color-button-primary)', color: 'var(--color-button-primary-text)' }}
              >
                Read More
              </span>
            </div>
          </div>

          {/* Content below image — mobile only */}
          <div className="md:hidden px-5 pt-5 pb-6" style={{ backgroundColor: data.background_color || '#ffffff' }}>
            {featured.category && (
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-3 w-fit"
                style={{ backgroundColor: 'var(--color-category-badge-bg)', color: 'var(--color-category-badge-text)' }}
              >
                {featured.category}
              </span>
            )}
            <h3
              className="text-xl leading-snug mb-3"
              style={headingCardStyle}
            >
              {featured.title}
            </h3>
            {featured.excerpt && (
              <p className="leading-relaxed mb-4" style={{ ...excerptFeaturedStyle, color: excerptCardStyle.color }}>
                {featured.excerpt}
              </p>
            )}
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-2 w-fit hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-button-primary)', color: 'var(--color-button-primary-text)' }}
            >
              Read More
            </span>
          </div>
        </Link>
      )}

      {/* Card grid */}
      <div className={`grid grid-cols-1 gap-6 sm:gap-8 ${count === 2 ? 'md:grid-cols-2' : count >= 3 ? 'md:grid-cols-3' : ''}`}>
        {grid.map((post) => {
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : null

          return (
            <Link key={post.id} href={`/devotionals/${post.slug}`} className="group block">
              <article>
                <div className="relative">
                  <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200" />
                    )}
                  </div>
                  {post.category && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center translate-y-1/2 z-10">
                      <span
                        className="text-xs font-bold uppercase tracking-widest px-4 py-1.5"
                        style={{ backgroundColor: 'var(--color-category-badge-bg)', color: 'var(--color-category-badge-text)' }}
                      >
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-8 pb-2 text-center">
                  <h3 className="text-xl font-bold text-neutral-900 font-heading leading-snug transition-colors text-balance group-hover:text-title-hover">
                    {post.title}
                  </h3>
                  {date && <p className="text-sm text-neutral-400 font-body mt-2">{date}</p>}
                  {post.excerpt && (
                    <p className="mt-2 leading-relaxed" style={excerptCardStyle}>
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4">
                    <span
                      className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-2 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: 'var(--color-button-primary)', color: 'var(--color-button-primary-text)' }}
                    >
                      Read More
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
