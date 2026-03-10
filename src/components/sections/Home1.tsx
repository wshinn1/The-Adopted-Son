'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export interface Home1Data {
  quote_before: string
  quote_highlight: string
  quote_after: string
  image_url: string
  image_alt: string
  card_label: string
  card_title_before: string
  card_title_highlight: string
  card_title_after: string
  card_description: string
  button_url: string
  background_color: string
}

interface Home1Props {
  data: Home1Data
}

export default function Home1({ data }: Home1Props) {
  return (
    <section
      className="min-h-screen w-full px-6 py-16 md:px-12 lg:px-24 lg:py-24"
      style={{ backgroundColor: data.background_color || '#F5F5F0' }}
    >
      {/* Quote */}
      <h1 className="max-w-4xl text-4xl font-medium leading-tight tracking-tight text-neutral-900 md:text-5xl lg:text-6xl">
        {data.quote_before}
        <em className="relative not-italic">
          <span className="relative z-10">{data.quote_highlight}</span>
          <span 
            className="absolute bottom-1 left-0 -z-0 h-3 w-full md:bottom-2 md:h-4"
            style={{ backgroundColor: '#FEF08A' }}
          />
        </em>
        {data.quote_after}
      </h1>

      {/* Image with overlapping card */}
      <div className="relative mt-12 md:mt-16 lg:mt-20">
        {/* Main Image */}
        <div className="relative aspect-[4/3] w-full md:w-3/4 lg:w-2/3">
          {data.image_url && (
            <Image
              src={data.image_url}
              alt={data.image_alt || 'Hero image'}
              fill
              className="object-cover"
              unoptimized={data.image_url.includes('blob.vercel-storage.com')}
            />
          )}
        </div>

        {/* Overlapping Card */}
        <div className="relative -mt-16 ml-auto w-11/12 bg-white p-8 shadow-sm md:absolute md:bottom-0 md:right-0 md:mt-0 md:w-1/2 md:p-10 lg:w-5/12 lg:p-12">
          {/* Label */}
          <span className="text-xs font-medium tracking-[0.2em] text-neutral-500">
            {data.card_label}
          </span>

          {/* Title */}
          <h2 className="mt-4 text-2xl font-medium leading-snug text-neutral-900 md:text-3xl lg:text-4xl">
            {data.card_title_before}{' '}
            <em className="font-serif">{data.card_title_highlight}</em>{' '}
            {data.card_title_after}
          </h2>

          {/* Description */}
          <p className="mt-4 text-base leading-relaxed text-neutral-600 md:mt-6">
            {data.card_description}
          </p>

          {/* Button */}
          <Link
            href={data.button_url}
            className="mt-6 inline-flex size-14 items-center justify-center bg-neutral-900 text-white transition-colors hover:bg-neutral-800 md:mt-8"
          >
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
