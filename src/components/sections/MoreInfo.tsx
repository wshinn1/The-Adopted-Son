'use client'

import Image from 'next/image'

export interface MoreInfoData {
  heading: string
  content: string
  image_url: string
  image_alt?: string
  image_position: 'left' | 'right'
  background_color?: string
  text_color?: string
}

interface MoreInfoProps {
  data: MoreInfoData
}

export default function MoreInfo({ data }: MoreInfoProps) {
  const {
    heading,
    content,
    image_url,
    image_alt = 'Image',
    image_position = 'left',
    background_color = '#ffffff',
    text_color = '#1a1a1a',
  } = data

  const isImageLeft = image_position === 'left'

  return (
    <section
      className="w-full px-6 py-16 md:px-12 md:py-20 lg:px-24 lg:py-24"
      style={{ backgroundColor: background_color }}
    >
      <div className="mx-auto max-w-7xl">
        <div className={`flex flex-col ${isImageLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center`}>
          {/* Image */}
          {image_url && (
            <div className="w-full lg:w-1/2 flex-shrink-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={image_url}
                  alt={image_alt}
                  fill
                  className="object-cover"
                  unoptimized={image_url.includes('blob.vercel-storage.com')}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="w-full lg:w-1/2">
            {heading && (
              <h2 
                className="text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl font-heading mb-6"
                style={{ color: text_color }}
              >
                {heading}
              </h2>
            )}

            {content && (
              <div 
                className="text-base md:text-lg leading-relaxed font-body prose prose-neutral max-w-none"
                style={{ color: text_color }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
