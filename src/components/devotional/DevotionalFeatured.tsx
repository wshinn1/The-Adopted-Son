import { TPost } from '@/data/posts'
import HeadingWithSub from '@/shared/Heading'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

interface Props {
  posts: TPost[]
  heading?: string
  subHeading?: string
  className?: string
}

const DevotionalFeatured: FC<Props> = ({ posts, heading, subHeading, className }) => {
  if (!posts.length) return null

  const featuredPost = posts[0]
  const sidePosts = posts.slice(1, 4)

  return (
    <div className={clsx('devotional-featured', className)}>
      <HeadingWithSub subHeading={subHeading}>{heading}</HeadingWithSub>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* FEATURED POST */}
        <Link href={`/devotionals/${featuredPost.handle}`} className="group relative block">
          <div className="relative aspect-4/3 lg:aspect-square overflow-hidden rounded-3xl">
            <Image
              src={typeof featuredPost.featuredImage === 'string' ? featuredPost.featuredImage : featuredPost.featuredImage.src}
              alt={featuredPost.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-6 lg:p-8">
              {featuredPost.categories?.[0] && (
                <span className="inline-block px-3 py-1 mb-3 text-xs font-medium rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {featuredPost.categories[0].name}
                </span>
              )}
              <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-3">
                {featuredPost.title}
              </h3>
              {featuredPost.excerpt && (
                <p className="mt-3 text-white/80 line-clamp-2 text-sm lg:text-base">
                  {featuredPost.excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3 text-white/70 text-sm">
                <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span>·</span>
                <span>{featuredPost.readingTime} min read</span>
              </div>
            </div>
          </div>
        </Link>

        {/* SIDE POSTS */}
        <div className="grid gap-6">
          {sidePosts.map((post) => (
            <Link
              key={post.id}
              href={`/devotionals/${post.handle}`}
              className="group flex gap-5 items-start"
            >
              <div className="relative w-32 sm:w-40 aspect-square shrink-0 overflow-hidden rounded-2xl">
                <Image
                  src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="160px"
                />
              </div>
              <div className="flex-1 py-1">
                {post.categories?.[0] && (
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {post.categories[0].name}
                  </span>
                )}
                <h4 className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h4>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 hidden sm:block">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-2 text-xs text-neutral-400 block">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' · '}{post.readingTime} min
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DevotionalFeatured
