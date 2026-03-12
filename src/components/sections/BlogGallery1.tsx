import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export interface BlogGallery1Data {
  heading: string
  subheading: string
  post_count: number
  background_color: string
  show_featured_banner: boolean
}

async function getRecentDevotionals(count: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('devotionals')
    .select(`
      id, title, slug, excerpt, cover_image_url, published_at,
      devotional_categories (
        categories ( name )
      )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(count + 1) // fetch one extra for featured banner
  return data || []
}

interface BlogGallery1Props {
  data: BlogGallery1Data
}

export default async function BlogGallery1({ data }: BlogGallery1Props) {
  const count = data.post_count || 3
  const showBanner = data.show_featured_banner !== false
  const devotionals = await getRecentDevotionals(showBanner ? count + 1 : count)

  const featured = showBanner ? devotionals[0] : null
  const grid = showBanner ? devotionals.slice(1, count + 1) : devotionals.slice(0, count)

  return (
    <section
      className="w-full py-16 px-6 md:px-12 lg:px-24"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      {/* Section heading */}
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

      {/* Featured banner */}
      {featured && showBanner && (
        <Link href={`/devotionals/${featured.slug}`} className="group block mb-8 relative overflow-hidden rounded-2xl">
          <div className="relative w-full aspect-[3/1] min-h-[200px]">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 max-w-2xl">
            {(featured.devotional_categories as any)?.[0]?.categories?.name && (
              <span className="inline-block bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-3 w-fit">
                {(featured.devotional_categories as any)[0].categories.name}
              </span>
            )}
            <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-bold font-heading leading-snug mb-4">
              {featured.title}
            </h3>
            <span className="inline-block bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 w-fit group-hover:bg-primary-700 transition-colors">
              Read More
            </span>
          </div>
        </Link>
      )}

      {/* Card grid */}
      <div className={`grid gap-8 ${count === 2 ? 'md:grid-cols-2' : count >= 3 ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
        {grid.map((post: any) => {
          const category = post.devotional_categories?.[0]?.categories?.name
          const date = post.published_at
            ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null

          return (
            <Link key={post.id} href={`/devotionals/${post.slug}`} className="group block">
              <article>
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-neutral-100">
                  {post.cover_image_url ? (
                    <>
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      {/* Category badge overlay */}
                      {category && (
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
                          <span className="bg-primary-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5">
                            {category}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">No image</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-neutral-900 font-heading text-center leading-snug group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>

                {/* Date */}
                {date && (
                  <p className="text-sm text-neutral-400 font-body text-center mt-2">{date}</p>
                )}
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
