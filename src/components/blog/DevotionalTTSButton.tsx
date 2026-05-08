'use client'

import { PauseIcon, PlayIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { useCallback, useRef, useState } from 'react'

interface Props {
  content?: Record<string, unknown> | null
  title: string
  voiceId?: string
  className?: string
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return (n.content as unknown[]).map(extractText).join(' ')
  return ''
}

function contentToText(content: Record<string, unknown> | null | undefined, title: string): string {
  if (!content) return title
  const text = extractText(content).replace(/\s+/g, ' ').trim()
  return text || title
}

export default function DevotionalTTSButton({ content, title, voiceId, className = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleClick = useCallback(async () => {
    setError(null)

    // Toggle play/pause if audio already loaded
    if (audioRef.current) {
      if (status === 'playing') {
        audioRef.current.pause()
        setStatus('paused')
      } else {
        audioRef.current.play()
        setStatus('playing')
      }
      return
    }

    const text = contentToText(content, title)
    setStatus('loading')

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate audio')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => setStatus('idle')
      audio.onpause = () => {
        if (!audio.ended) setStatus('paused')
      }
      audio.onplay = () => setStatus('playing')

      await audio.play()
      setStatus('playing')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
    }
  }, [content, title, voiceId, status])

  const label =
    status === 'loading' ? 'Generating audio…' :
    status === 'playing' ? 'Pause' :
    status === 'paused'  ? 'Resume' :
    'Listen'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        aria-label={label}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        {status === 'loading' && (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Generating…</span>
          </>
        )}
        {status === 'playing' && <><PauseIcon className="size-4" /><span>Pause</span></>}
        {status === 'paused'  && <><PlayIcon  className="size-4 ms-0.5" /><span>Resume</span></>}
        {status === 'idle'    && <><SpeakerWaveIcon className="size-4" /><span>Listen</span></>}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
