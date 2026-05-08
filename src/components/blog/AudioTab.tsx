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
    <div className="fixed bottom-8 right-0 z-50 flex items-end justify-end">
      {/* Expanded player panel */}
      {open && (
        <div className="mb-0 mr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-5 w-80">
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
      )}

      {/* Tab button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close audio player' : 'Open audio player'}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-l-xl shadow-lg transition-colors"
        style={{ writingMode: 'horizontal-tb' }}
      >
        <SpeakerWaveIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">Listen</span>
      </button>
    </div>
  )
}
