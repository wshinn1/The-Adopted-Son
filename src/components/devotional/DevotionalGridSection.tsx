import { TPost } from '@/data/posts'
import ButtonPrimary from '@/shared/ButtonPrimary'
import HeadingWithSub from '@/shared/Heading'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Link from 'next/link'
import { FC, ReactNode } from 'react'
import DevotionalCard from './DevotionalCard'

interface Props {
  posts?: TPost[]
  className?: string
  gridClass?: string
  heading?: ReactNode
  subHeading?: ReactNode
  headingIsCenter?: boolean
  showViewAll?: boolean
}

const DevotionalGridSection: FC<Props> = ({
  posts,
  className,
  gridClass,
  heading,
  subHeading,
  headingIsCenter,
  showViewAll = true,
}) => {
  if (!posts?.length) return null

  return (
    <div className={clsx('devotional-grid-section relative', className)}>
      <HeadingWithSub subHeading={subHeading as string} isCenter={headingIsCenter}>
        {heading}
      </HeadingWithSub>
      <div className={clsx('mt-10 lg:mt-14 grid gap-6 md:gap-8', gridClass)}>
        {posts.map((post) => (
          <DevotionalCard key={post.id} post={post} />
        ))}
      </div>
      {showViewAll && (
        <div className="mt-14 flex items-center justify-center">
          <Link href="/devotionals">
            <ButtonPrimary>
              View all devotionals
              <ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
            </ButtonPrimary>
          </Link>
        </div>
      )}
    </div>
  )
}

export default DevotionalGridSection
