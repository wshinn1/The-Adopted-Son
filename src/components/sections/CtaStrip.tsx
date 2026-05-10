'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

export interface CtaStripData {
  headline: string
  subtext: string
  button_text: string
  button_url: string
  bg_color: string
  text_color: string
  subtext_color: string
  button_bg_color: string
  button_text_color: string
  button_hover_bg_color: string
  show_icon: boolean
  icon_color: string
  full_width: boolean
  headline_size: string
  subtext_size: string
}

const defaultData: CtaStripData = {
  headline: 'Support This Ministry',
  subtext: 'Your generosity helps us create daily devotionals and reach more people.',
  button_text: 'Give Today',
  button_url: '/give',
  bg_color: '#1a1a2e',
  text_color: '#ffffff',
  subtext_color: '#a0a8c0',
  button_bg_color: '#ffffff',
  button_text_color: '#1a1a2e',
  button_hover_bg_color: '#f0f0f0',
  show_icon: true,
  icon_color: 'rgba(255,255,255,0.7)',
  full_width: false,
  headline_size: '14px',
  subtext_size: '12px',
}

interface Props {
  data?: Partial<CtaStripData>
}

export default function CtaStrip({ data = {} }: Props) {
  const d: CtaStripData = { ...defaultData, ...data }
  const [hovered, setHovered] = useState(false)

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-stretch gap-4 overflow-hidden rounded-xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ backgroundColor: d.bg_color }}
    >
      <div className="flex items-center gap-3">
        {d.show_icon && (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Sparkles className="size-4" style={{ color: d.icon_color }} />
          </div>
        )}
        <div>
          <p className="font-semibold" style={{ color: d.text_color, fontSize: d.headline_size }}>
            {d.headline}
          </p>
          {d.subtext && (
            <p className="mt-0.5" style={{ color: d.subtext_color, fontSize: d.subtext_size }}>
              {d.subtext}
            </p>
          )}
        </div>
      </div>

      <Link
        href={d.button_url || '/'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="inline-flex items-center justify-center w-full sm:w-auto shrink-0 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        style={{
          backgroundColor: hovered ? d.button_hover_bg_color : d.button_bg_color,
          color: d.button_text_color,
          minWidth: '140px',
        }}
      >
        {d.button_text}
      </Link>
    </motion.div>
  )

  if (d.full_width) {
    return (
      <section className="w-full px-4 py-3">
        {inner}
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-3">
      {inner}
    </section>
  )
}
