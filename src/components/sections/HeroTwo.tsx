'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export interface HeroTwoData {
  // Content
  headline: string
  subheadline: string
  show_subheadline: boolean
  button_text: string
  button_url: string
  show_button: boolean
  trust_text: string
  show_trust_text: boolean

  // Background
  background_type: 'image' | 'color' | 'gradient'
  background_image_url: string
  background_color: string
  gradient_from: string
  gradient_to: string
  gradient_direction: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-tr'
  overlay_opacity: number

  // Text
  text_color: string
  button_bg_color: string
  button_text_color: string

  // Layout
  min_height: string
  content_width: 'narrow' | 'medium' | 'wide' | 'full'
  text_align: 'left' | 'center' | 'right'
}

const defaultData: HeroTwoData = {
  headline: 'Before you finish turning around, the Father is already running toward you.',
  subheadline: 'Daily devotionals to draw you deeper into your identity as a child of God.',
  show_subheadline: true,
  button_text: 'Read Devotionals',
  button_url: '/devotionals',
  show_button: true,
  trust_text: 'Free to read · No account required',
  show_trust_text: true,
  background_type: 'gradient',
  background_image_url: '',
  background_color: '#1a1a2e',
  gradient_from: '#1a1a2e',
  gradient_to: '#2B4A6F',
  gradient_direction: 'to-br',
  overlay_opacity: 0.4,
  text_color: '#ffffff',
  button_bg_color: '#ffffff',
  button_text_color: '#1a1a1a',
  min_height: '70vh',
  content_width: 'medium',
  text_align: 'center',
}

const GRADIENT_CLASSES: Record<string, string> = {
  'to-r':  'bg-gradient-to-r',
  'to-br': 'bg-gradient-to-br',
  'to-b':  'bg-gradient-to-b',
  'to-bl': 'bg-gradient-to-bl',
  'to-tr': 'bg-gradient-to-tr',
}

const WIDTH_CLASSES: Record<string, string> = {
  narrow: 'max-w-xl',
  medium: 'max-w-2xl',
  wide:   'max-w-4xl',
  full:   'max-w-full',
}

const ALIGN_CLASSES: Record<string, string> = {
  left:   'text-left items-start',
  center: 'text-center items-center',
  right:  'text-right items-end',
}

export default function HeroTwo({ data }: { data: Partial<HeroTwoData> }) {
  const d: HeroTwoData = { ...defaultData, ...data }

  const widthClass  = WIDTH_CLASSES[d.content_width]  ?? WIDTH_CLASSES.medium
  const alignClass  = ALIGN_CLASSES[d.text_align]      ?? ALIGN_CLASSES.center

  // Build background style
  let backgroundStyle: React.CSSProperties = {}
  if (d.background_type === 'image' && d.background_image_url) {
    backgroundStyle = { position: 'relative' }
  } else if (d.background_type === 'color') {
    backgroundStyle = { backgroundColor: d.background_color }
  } else {
    // gradient — inline style since colors are dynamic
    backgroundStyle = {
      background: `linear-gradient(${
        d.gradient_direction === 'to-r'  ? '90deg'  :
        d.gradient_direction === 'to-br' ? '135deg' :
        d.gradient_direction === 'to-b'  ? '180deg' :
        d.gradient_direction === 'to-bl' ? '225deg' :
        '45deg'
      }, ${d.gradient_from}, ${d.gradient_to})`,
    }
  }

  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ minHeight: d.min_height, ...backgroundStyle }}
    >
      {/* Background image */}
      {d.background_type === 'image' && d.background_image_url && (
        <>
          <Image
            src={d.background_image_url}
            alt=""
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${d.overlay_opacity})` }}
          />
        </>
      )}

      {/* Content */}
      <div className={`relative z-10 w-full px-6 py-20 flex flex-col ${alignClass}`}>
        <div className={`w-full ${widthClass} mx-auto flex flex-col ${alignClass} gap-0`}>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ color: d.text_color }}
          >
            {d.headline}
          </motion.h1>

          {d.show_subheadline && d.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg sm:text-xl leading-relaxed"
              style={{ color: d.text_color, opacity: 0.85 }}
            >
              {d.subheadline}
            </motion.p>
          )}

          {d.show_button && d.button_text && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <Link
                href={d.button_url || '/'}
                className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold shadow-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: d.button_bg_color, color: d.button_text_color }}
              >
                {d.button_text}
              </Link>
            </motion.div>
          )}

          {d.show_trust_text && d.trust_text && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-4 text-sm"
              style={{ color: d.text_color, opacity: 0.6 }}
            >
              {d.trust_text}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  )
}
