'use client'

import { TPost } from '@/data/posts'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { FC, useState } from 'react'

interface Props {
  className?: string
  post: TPost
  ratio?: string
}

const DevotionalCard: FC<Props> = ({ className, post, ratio = 'aspect-4/3' }) => {
  const { title, handle, categories, date, readingTime, excerpt } = post
  const [isHover, setIsHover] = useState(false)

  const featuredImageSrc = typeof post.featuredImage === 'string' 
    ? post.featuredImage 
    : post.featuredImage.src

  return (
    <div
      className={clsx('group post-card relative flex flex-col rounded-3xl bg-white dark:bg-white/5', className)}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Link href={`/devotionals/${handle}`} className="relative block w-full shrink-0 overflow-hidden rounded-t-3xl">
        <div className={clsx('relative w-full', ratio)}>
          <Image
            src={featuredImageSrc}
            alt={title}
            fill
            className={clsx(
              'object-cover transition-transform duration-500',
              isHover && 'scale-105'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
        {categories?.[0] && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-600 text-white">
            {categories[0].name}
          </span>
        )}
      </Link>

      <div className="flex grow flex-col gap-y-3 rounded-b-3xl border border-t-0 border-neutral-100 dark:border-neutral-800 p-4">
        <span className="text-xs text-neutral-500">
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <h3 className="nc-card-title block text-base font-semibold text-neutral-900 dark:text-neutral-100">
          <Link href={`/devotionals/${handle}`} className="line-clamp-2" title={title}>
            {title}
          </Link>
        </h3>
        {excerpt && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-neutral-500 pt-2">
          <span>{readingTime} min read</span>
        </div>
      </div>
    </div>
  )
}

export default DevotionalCard
