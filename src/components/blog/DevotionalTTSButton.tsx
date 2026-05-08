'use client'

import { PauseIcon, PlayIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  content?: Record<string, unknown> | null
  title: string
  devotionalId: string
  voiceId?: string
  cachedAudioUrl?: string | null
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

function storageKey(id: string) {
  return `tts_position_${id}`
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function DevotionalTTSButton({
  content,
  title,
  devotionalId,
  voiceId,
  cachedAudioUrl,
  className = '',
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [savedPosition, setSavedPosition] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(devotionalId))
    if (saved) setSavedPosition(parseFloat(saved))
  }, [devotionalId])

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

    setStatus('loading')

    try {
      let audioUrl: string

      if (cachedAudioUrl) {
        audioUrl = cachedAudioUrl
      } else {
        const text = contentToText(content, title)
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId, devotionalId }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to generate audio')
        }

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await response.json()
          audioUrl = data.audioUrl
        } else {
          const blob = await response.blob()
          audioUrl = URL.createObjectURL(blob)
        }
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      // Resume from saved position
      const saved = parseFloat(localStorage.getItem(storageKey(devotionalId)) ?? '0')
      if (saved > 0) audio.currentTime = saved

      // Save position periodically
      audio.ontimeupdate = () => {
        if (audio.currentTime > 0) {
          localStorage.setItem(storageKey(devotionalId), String(audio.currentTime))
          setSavedPosition(audio.currentTime)
        }
      }

      audio.onended = () => {
        localStorage.removeItem(storageKey(devotionalId))
        setSavedPosition(0)
        setStatus('idle')
      }
      audio.onpause = () => { if (!audio.ended) setStatus('paused') }
      audio.onplay  = () => setStatus('playing')

      await audio.play()
      setStatus('playing')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
    }
  }, [content, title, devotionalId, voiceId, cachedAudioUrl, status])

  const handleRestart = useCallback(() => {
    localStorage.removeItem(storageKey(devotionalId))
    setSavedPosition(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }, [devotionalId])

  const isLoaded = !!audioRef.current
  const hasResume = savedPosition > 30 && !isLoaded

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        aria-label={status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Listen'}
        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
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

      {/* Resume from saved position */}
      {hasResume && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>Saved at {formatTime(savedPosition)}</span>
          <button
            type="button"
            onClick={handleRestart}
            className="underline hover:text-neutral-700"
          >
            Restart
          </button>
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
