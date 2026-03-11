'use client'

import Image from 'next/image'

export interface TextSectionData {
  heading: string
  content: string // Rich text HTML content
  featured_image_url?: string
  featured_image_alt?: string
  image_position: 'top' | 'bottom' | 'none'
  background_color?: string
  max_width?: 'narrow' | 'medium' | 'wide' | 'full'
}

interface TextSectionProps {
  data: TextSectionData
}

export default function TextSection({ data }: TextSectionProps) {
  const {
    heading,
    content,
    featured_image_url,
    featured_image_alt = 'Featured image',
    image_position = 'bottom',
    background_color = '#ffffff',
    max_width = 'medium',
  } = data

  // Map max_width to Tailwind classes
  const maxWidthClasses = {
    narrow: 'max-w-2xl',
    medium: 'max-w-4xl',
    wide: 'max-w-6xl',
    full: 'max-w-7xl',
  }

  const showImage = featured_image_url && image_position !== 'none'

  return (
    <section
      className="w-full px-6 py-16 md:px-12 md:py-20 lg:px-24 lg:py-24"
      style={{ backgroundColor: background_color }}
    >
      <div className={`mx-auto ${maxWidthClasses[max_width]}`}>
        {/* Heading */}
        {heading && (
          <h2 className="text-3xl font-medium leading-tight text-neutral-900 md:text-4xl lg:text-5xl font-heading mb-6">
            {heading}
          </h2>
        )}

        {/* Image at top (below heading, above content) */}
        {showImage && image_position === 'top' && (
          <div className="relative mb-12 w-full overflow-hidden">
            <Image
              src={featured_image_url}
              alt={featured_image_alt}
              width={1200}
              height={800}
              className="w-full h-auto object-cover"
              unoptimized={featured_image_url.includes('blob.vercel-storage.com')}
            />
          </div>
        )}

        {/* Rich text content */}
        {content && (
          <div 
            className="prose prose-lg prose-neutral max-w-none font-body
              prose-headings:font-heading prose-headings:font-medium
              prose-p:text-neutral-600 prose-p:leading-relaxed
              prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-neutral-900
              prose-blockquote:border-l-primary-500 prose-blockquote:bg-neutral-50 prose-blockquote:py-4 prose-blockquote:px-6
              prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Image at bottom */}
        {showImage && image_position === 'bottom' && (
          <div className="relative mt-12 w-full overflow-hidden">
            <Image
              src={featured_image_url}
              alt={featured_image_alt}
              width={1200}
              height={800}
              className="w-full h-auto object-cover"
              unoptimized={featured_image_url.includes('blob.vercel-storage.com')}
            />
          </div>
        )}
      </div>
    </section>
  )
}
