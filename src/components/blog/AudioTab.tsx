'use client'

import { SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import DevotionalTTSButton from './DevotionalTTSButton'

interface Props {
  content?: Record<string, unknown> | null
  title: string
  devotionalId: string
  voiceId?: string
  cachedAudioUrl?: string | null
}

export default function AudioTab({ content, title, devotionalId, voiceId, cachedAudioUrl }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed top-16 left-0 z-50 flex flex-col items-start">
      {/* Tab button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close audio player' : 'Open audio player'}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-r-xl shadow-lg transition-colors"
      >
        <SpeakerWaveIcon className="size-4 shrink-0" />
        <span>Listen</span>
      </button>

      {/* Expanded player panel — always mounted to preserve audio state */}
      <div
        className={`mt-2 ml-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-5 w-80 transition-all duration-200 ${
          open ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Listen to this post</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-lg leading-none"
            aria-label="Close audio player"
          >
            ×
          </button>
        </div>
        <DevotionalTTSButton
          content={content}
          title={title}
          devotionalId={devotionalId}
          voiceId={voiceId}
          cachedAudioUrl={cachedAudioUrl}
        />
      </div>
    </div>
  )
}
