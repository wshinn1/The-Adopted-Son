'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import DevotionalsPagination from './DevotionalsPagination'

interface Post {
  id: string
  handle: string
  title: string
  excerpt?: string
  date: string
  featuredImage: string | { src: string }
  categories?: { name: string }[]
}

interface DevotionalsGridProps {
  posts: Post[]
  currentPage: number
  totalPages: number
  search?: string
}

export default function DevotionalsGrid({
  posts,
  currentPage,
  totalPages,
  search,
}: DevotionalsGridProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayPosts, setDisplayPosts] = useState(posts)

  // Handle animation when posts change
  useEffect(() => {
    if (JSON.stringify(posts) !== JSON.stringify(displayPosts)) {
      setIsAnimating(true)
      // Wait for fade out
      const timer = setTimeout(() => {
        setDisplayPosts(posts)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [posts, displayPosts])

  return (
    <section id="more-devotionals">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-blue-500 rounded-full" />
        <h2 className="text-2xl font-bold text-gray-900 font-heading">More Devotionals</h2>
      </div>

      {displayPosts.length > 0 ? (
        <>
          <div 
            className={`grid md:grid-cols-2 gap-8 transition-all duration-300 ease-in-out ${
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {displayPosts.map((post, index) => {
              const postDate = new Date(post.date)
              const day = postDate.getDate()
              const month = postDate.toLocaleDateString('en-US', { month: 'short' })
              
              return (
                <Link key={post.id} href={`/devotionals/${post.handle}`} className="group block">
                  <article>
                    {/* Large Image with Date Badge */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
                      <Image
                        src={typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage.src}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={index < 2}
                        loading={index < 2 ? "eager" : "lazy"}
                        unoptimized
                      />
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-4 py-2 rounded-lg text-center">
                        <div className="text-2xl font-bold leading-none">{day}</div>
                        <div className="text-xs uppercase">{month}</div>
                      </div>
                    </div>
                    
                    {/* Categories/Tags */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {post.categories.slice(0, 3).map((cat, i) => (
                          <span key={i} className="text-sm font-medium text-rose-500">
                            #{cat.name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors font-heading">
                      {post.title}
                    </h3>
                    
                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 line-clamp-3 font-body leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </article>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <DevotionalsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              search={search}
              sectionId="more-devotionals"
            />
          )}
        </>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-800 font-heading">
            {search ? `No results for "${search}"` : 'No devotionals found'}
          </h3>
          <p className="mt-4 text-gray-600 font-body">
            {search ? 'Try a different search term.' : 'Check back soon for inspiring daily readings.'}
          </p>
          {search && (
            <Link href="/devotionals" className="mt-6 inline-block px-6 py-3 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
              View all devotionals
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
